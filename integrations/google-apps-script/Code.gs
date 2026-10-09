const SHEETS = Object.freeze({
  subscribers: "Subscribers",
  vartalap: "Vartalap",
  feedback: "AevaFeedback",
  publications: "PublicationQueue",
  settings: "Settings",
});

const HEADERS = Object.freeze({
  Subscribers: [
    "email",
    "journal",
    "knowledge",
    "noticeAccepted",
    "policyVersion",
    "status",
    "createdAt",
    "updatedAt",
  ],
  Vartalap: [
    "questionId",
    "contentId",
    "contentType",
    "contentSlug",
    "name",
    "email",
    "question",
    "anonymous",
    "noticeAccepted",
    "policyVersion",
    "submittedAt",
    "reply",
    "public",
    "publishedAt",
  ],
  AevaFeedback: [
    "feedbackId",
    "rating",
    "message",
    "conversationId",
    "page",
    "policyVersion",
    "submittedAt",
    "reason",
    "responseId",
    "priority",
  ],
  PublicationQueue: [
    "publicationId",
    "contentType",
    "slug",
    "title",
    "publishedAt",
    "scheduledAt",
    "status",
    "createdAt",
    "sentAt",
  ],
  Settings: ["key", "value", "updatedAt"],
});

const ALLOWED_SETTINGS = new Set([
  "notification.journalKnowledgeHold",
  "notification.globalMailHold",
]);

function doPost(event) {
  try {
    const request = JSON.parse(event.postData.contents || "{}");
    verifyRequest_(request);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      return json_(dispatch_(request));
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error && error.stack ? error.stack : String(error));
    return json_({ ok: false, error: "request_rejected" });
  }
}

function dispatch_(request) {
  switch (request.action) {
    case "subscribe":
      return subscribe_(request);
    case "vartalap_submit":
      return vartalapSubmit_(request);
    case "vartalap_public":
      return { ok: true, data: vartalapPublic_(request.contentId) };
    case "feedback_submit":
      return feedbackSubmit_(request);
    case "publication_event":
      return publicationEvent_(request);
    case "notification_status":
    case "admin_notification_state":
      return { ok: true, data: notificationState_() };
    case "admin_set_setting":
      return setSetting_(request);
    case "admin_send_notifications":
      return sendNotifications_();
    case "admin_vartalap_list":
      return { ok: true, data: vartalapAdminList_() };
    case "admin_vartalap_reply":
      return vartalapReply_(request);
    default:
      throw new Error("Unsupported action");
  }
}

function verifyRequest_(request) {
  const properties = PropertiesService.getScriptProperties();
  const serviceToken = requiredProperty_(properties, "SERVICE_TOKEN");
  const signingSecret = requiredProperty_(properties, "SIGNING_SECRET");
  const timestamp = Number(request.timestamp);

  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > 300000) {
    throw new Error("Expired request");
  }
  if (!safeEqual_(String(request.serviceToken || ""), serviceToken)) {
    throw new Error("Invalid service token");
  }

  const unsigned = Object.assign({}, request);
  delete unsigned.serviceToken;
  delete unsigned.timestamp;
  delete unsigned.signature;
  const message = String(timestamp) + "." + stableJson_(unsigned);
  const bytes = Utilities.computeHmacSha256Signature(message, signingSecret);
  const expected = bytes
    .map(function (value) {
      return (value < 0 ? value + 256 : value).toString(16).padStart(2, "0");
    })
    .join("");

  if (!safeEqual_(String(request.signature || ""), expected)) {
    throw new Error("Invalid signature");
  }
}

function subscribe_(request) {
  const email = normalizedEmail_(request.email);
  const sheet = sheet_(SHEETS.subscribers);
  const rows = values_(sheet);
  const now = new Date().toISOString();
  const existing = rows.findIndex(function (row) {
    return String(row.email).toLowerCase() === email;
  });
  const record = {
    email: email,
    journal: request.journal !== false,
    knowledge: request.knowledge !== false,
    noticeAccepted: request.noticeAccepted === true,
    policyVersion: text_(request.policyVersion, 80),
    status: "active",
    createdAt: existing >= 0 ? rows[existing].createdAt : now,
    updatedAt: now,
  };
  if (!record.noticeAccepted || (!record.journal && !record.knowledge)) {
    throw new Error("Invalid subscription");
  }
  upsertRow_(sheet, existing, record);
  return { ok: true };
}

function vartalapSubmit_(request) {
  const now = new Date().toISOString();
  const record = {
    questionId: "VRT-" + Utilities.getUuid(),
    contentId: identifier_(request.contentId, 100),
    contentType: identifier_(request.contentType, 32),
    contentSlug: identifier_(request.contentSlug, 160),
    name: text_(request.name, 80),
    email: normalizedEmail_(request.email),
    question: text_(request.question, 2000),
    anonymous: request.anonymous === true,
    noticeAccepted: request.noticeAccepted === true,
    policyVersion: text_(request.policyVersion, 80),
    submittedAt: now,
    reply: "",
    public: false,
    publishedAt: "",
  };
  if (!record.noticeAccepted || record.question.length < 5) {
    throw new Error("Invalid Vartalap submission");
  }
  append_(sheet_(SHEETS.vartalap), record);
  return { ok: true, data: { questionId: record.questionId } };
}

function vartalapPublic_(contentId) {
  const selected = identifier_(contentId, 100);
  return values_(sheet_(SHEETS.vartalap))
    .filter(function (row) {
      return row.contentId === selected && truthy_(row.public) && row.reply;
    })
    .slice(-100)
    .map(function (row) {
      return {
        questionId: row.questionId,
        displayName: truthy_(row.anonymous) ? "Anonymous reader" : row.name,
        question: row.question,
        reply: row.reply,
        publishedAt: row.publishedAt || row.submittedAt,
      };
    });
}

function vartalapAdminList_() {
  return values_(sheet_(SHEETS.vartalap))
    .slice(-500)
    .reverse()
    .map(function (row) {
      return {
        questionId: row.questionId,
        contentType: row.contentType,
        contentSlug: row.contentSlug,
        name: row.name,
        question: row.question,
        anonymous: truthy_(row.anonymous),
        submittedAt: row.submittedAt,
        reply: row.reply || "",
        public: truthy_(row.public),
      };
    });
}

function vartalapReply_(request) {
  const sheet = sheet_(SHEETS.vartalap);
  const rows = values_(sheet);
  const id = identifier_(request.questionId, 120);
  const index = rows.findIndex(function (row) {
    return row.questionId === id;
  });
  if (index < 0) throw new Error("Question not found");
  rows[index].reply = text_(request.reply, 4000);
  rows[index].public = request.public === true;
  rows[index].publishedAt = request.public === true ? new Date().toISOString() : "";
  upsertRow_(sheet, index, rows[index]);
  return { ok: true };
}

function feedbackSubmit_(request) {
  const rating = String(request.rating || "");
  if (["helpful", "not-helpful", "mixed"].indexOf(rating) < 0) {
    throw new Error("Invalid feedback rating");
  }
  append_(sheet_(SHEETS.feedback), {
    feedbackId: "FDB-" + Utilities.getUuid(),
    rating: rating,
    message: text_(request.message || "", 500),
    conversationId: "",
    page: text_(request.page || "/aeva", 300),
    policyVersion: text_(request.policyVersion, 80),
    submittedAt: new Date().toISOString(),
    reason: identifier_(request.reason || rating, 40),
    responseId: identifier_(request.responseId, 80),
    priority: request.reason === "privacy-concern" ? "urgent" : "normal",
  });
  return { ok: true };
}

function publicationEvent_(request) {
  const holds = settings_();
  const held = holds["notification.globalMailHold"] === "true" ||
    holds["notification.journalKnowledgeHold"] === "true";
  append_(sheet_(SHEETS.publications), {
    publicationId: identifier_(request.publicationId, 160),
    contentType: identifier_(request.contentType, 32),
    slug: identifier_(request.slug, 160),
    title: text_(request.title, 200),
    publishedAt: text_(request.publishedAt, 80),
    scheduledAt: text_(request.scheduledAt || "", 80),
    status: held ? "held" : "queued",
    createdAt: new Date().toISOString(),
    sentAt: "",
  });
  return { ok: true };
}

function setSetting_(request) {
  const key = String(request.key || "");
  if (!ALLOWED_SETTINGS.has(key) || typeof request.value !== "boolean") {
    throw new Error("Invalid setting");
  }
  const sheet = sheet_(SHEETS.settings);
  const rows = values_(sheet);
  const index = rows.findIndex(function (row) {
    return row.key === key;
  });
  upsertRow_(sheet, index, {
    key: key,
    value: String(request.value),
    updatedAt: new Date().toISOString(),
  });
  return { ok: true, data: notificationState_() };
}

function notificationState_() {
  const queue = values_(sheet_(SHEETS.publications));
  const settings = settings_();
  const quota = Math.max(0, MailApp.getRemainingDailyQuota());
  const scheduled = queue.filter(function (row) {
    return row.status === "scheduled";
  });
  return {
    journalKnowledgeHold:
      settings["notification.journalKnowledgeHold"] === "true",
    globalMailHold: settings["notification.globalMailHold"] === "true",
    scheduled: scheduled.length,
    held: queue.filter(function (row) { return row.status === "held"; }).length,
    queued: queue.filter(function (row) { return row.status === "queued"; }).length,
    remainingDailyQuota: quota,
    nextScheduledAt: scheduled.length ? scheduled[0].scheduledAt : null,
  };
}

function sendNotifications_() {
  const state = notificationState_();
  if (state.globalMailHold || state.journalKnowledgeHold) {
    return { ok: true, data: state };
  }
  const publications = sheet_(SHEETS.publications);
  const queue = values_(publications);
  const subscribers = values_(sheet_(SHEETS.subscribers)).filter(function (row) {
    return row.status === "active";
  });
  let remaining = Math.max(0, MailApp.getRemainingDailyQuota());
  const now = Date.now();

  queue.forEach(function (publication, index) {
    if (["queued", "scheduled"].indexOf(publication.status) < 0 || remaining < 1) return;
    if (publication.scheduledAt && Date.parse(publication.scheduledAt) > now) {
      publication.status = "scheduled";
      upsertRow_(publications, index, publication);
      return;
    }
    const recipients = subscribers.filter(function (subscriber) {
      return publication.contentType === "journal"
        ? truthy_(subscriber.journal)
        : truthy_(subscriber.knowledge);
    });
    const sendable = recipients.slice(0, remaining);
    sendable.forEach(function (subscriber) {
      MailApp.sendEmail({
        to: subscriber.email,
        subject: "AKB Studio: " + publication.title,
        body: "A new " + publication.contentType + " entry is available: " + publication.title,
        name: "AKB Studio",
      });
      remaining -= 1;
    });
    publication.status = sendable.length === recipients.length ? "sent" : "queued";
    publication.sentAt = publication.status === "sent" ? new Date().toISOString() : "";
    upsertRow_(publications, index, publication);
  });
  return { ok: true, data: notificationState_() };
}

function settings_() {
  return values_(sheet_(SHEETS.settings)).reduce(function (result, row) {
    result[row.key] = String(row.value);
    return result;
  }, {});
}

function spreadsheet_() {
  const id = requiredProperty_(PropertiesService.getScriptProperties(), "SPREADSHEET_ID");
  return SpreadsheetApp.openById(id);
}

function sheet_(name) {
  const spreadsheet = spreadsheet_();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  const headers = HEADERS[name];
  if (!headers) throw new Error("Unknown sheet");
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  else if (name === SHEETS.feedback && sheet.getLastColumn() < headers.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function values_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).map(function (row) {
    return headers.reduce(function (record, header, index) {
      record[header] = row[index];
      return record;
    }, {});
  });
}

function append_(sheet, record) {
  const headers = HEADERS[sheet.getName()];
  sheet.appendRow(headers.map(function (header) { return sheetText_(record[header]); }));
}

function upsertRow_(sheet, zeroBasedDataIndex, record) {
  const headers = HEADERS[sheet.getName()];
  const row = headers.map(function (header) { return sheetText_(record[header]); });
  if (zeroBasedDataIndex < 0) sheet.appendRow(row);
  else sheet.getRange(zeroBasedDataIndex + 2, 1, 1, row.length).setValues([row]);
}

function normalizedEmail_(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    throw new Error("Invalid email");
  }
  return email;
}

function identifier_(value, maximum) {
  const result = String(value || "").trim();
  if (!result || result.length > maximum || !/^[a-zA-Z0-9._:-]+$/.test(result)) {
    throw new Error("Invalid identifier");
  }
  return result;
}

function text_(value, maximum) {
  const result = String(value == null ? "" : value).trim();
  if (result.length > maximum) throw new Error("Text is too long");
  return result;
}

function truthy_(value) {
  return value === true || String(value).toLowerCase() === "true";
}

function sheetText_(value) {
  if (typeof value === "boolean" || typeof value === "number") return value;
  const result = String(value == null ? "" : value);
  return /^[=+\-@]/.test(result) ? "'" + result : result;
}

function stableJson_(value) {
  if (Array.isArray(value)) return "[" + value.map(stableJson_).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(function (key) {
      return JSON.stringify(key) + ":" + stableJson_(value[key]);
    }).join(",") + "}";
  }
  return JSON.stringify(value);
}

function safeEqual_(left, right) {
  const a = String(left);
  const b = String(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (a.charCodeAt(index % Math.max(1, a.length)) || 0) ^
      (b.charCodeAt(index % Math.max(1, b.length)) || 0);
  }
  return difference === 0;
}

function requiredProperty_(properties, name) {
  const value = properties.getProperty(name);
  if (!value) throw new Error("Missing Script Property: " + name);
  return value;
}

function json_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
