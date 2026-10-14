const AKB = Object.freeze({
  properties: Object.freeze({
    spreadsheetId: "AKB_SPREADSHEET_ID",
    serviceToken: "AKB_SERVICE_TOKEN",
    signingSecret: "APPS_SCRIPT_SIGNING_SECRET",
  }),
  security: Object.freeze({
    requestMaxAgeMs: 5 * 60 * 1000,
  }),
  sheets: Object.freeze({
    Subscribers: Object.freeze([
      "subscriberId",
      "email",
      "journal",
      "knowledge",
      "status",
      "subscribedAt",
      "unsubscribedAt",
      "lastDigestAt",
    ]),
    Vartalap: Object.freeze([
      "questionId",
      "contentId",
      "contentType",
      "contentSlug",
      "name",
      "email",
      "question",
      "anonymous",
      "submittedAt",
      "status",
      "reply",
      "repliedAt",
      "public",
      "publishedAt",
    ]),
    AevaFeedback: Object.freeze([
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
      "kind",
      "transcriptConsented",
      "reportExcerpt",
      "status",
      "ownerNote",
      "updatedAt",
    ]),
    PublicationEvents: Object.freeze([
      "eventId",
      "publicationId",
      "contentType",
      "slug",
      "title",
      "publishedAt",
      "notificationRequested",
      "eligibleAt",
      "status",
      "digestId",
      "cancelledAt",
    ]),
    NotificationQueue: Object.freeze([
      "digestId",
      "subscriberId",
      "publicationIds",
      "audience",
      "status",
      "scheduledAt",
      "sentAt",
      "attemptCount",
      "nextAttemptAt",
      "lastErrorCode",
    ]),
    DeliveryLog: Object.freeze([
      "deliveryId",
      "digestId",
      "subscriberId",
      "status",
      "attemptedAt",
      "sentAt",
      "errorCode",
    ]),
    Settings: Object.freeze(["key", "value"]),
  }),
  settings: Object.freeze({
    "notification.journalKnowledgeHold": false,
    "notification.globalMailHold": false,
    "notification.defaultDelayHours": 12,
    "notification.dailyReserve": 10,
    "notification.digestWindowHours": 12,
    "notification.timezone": "Asia/Kolkata",
    "notification.defaultSendTime": "",
    "vartalap.acceptingQuestions": true,
    "vartalap.publicRepliesEnabled": true,
  }),
});
function initializePublishingService() {
  const properties = PropertiesService.getScriptProperties();
  const configuredId = properties.getProperty(AKB.properties.spreadsheetId);
  const spreadsheet = configuredId
    ? SpreadsheetApp.openById(configuredId)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("spreadsheet_not_configured");
  if (!configuredId)
    properties.setProperty(AKB.properties.spreadsheetId, spreadsheet.getId());
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) throw new Error("service_busy");
  try {
    Object.entries(AKB.sheets).forEach(([name, headers]) => {
      if (name === "AevaFeedback") {
        ensureFeedbackSheet_(spreadsheet);
        return;
      }
      const sheet = spreadsheet.getSheetByName(name);
      if (!sheet) throw new Error("required_sheet_missing");
      if (sheet.getLastRow() === 0) sheet.appendRow(headers);
      validateHeaders_(sheet, headers);
    });
    initializeDefaultSettings_();
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function runFoundationCheck() {
  let stage = "configuration";
  try {
    const properties = PropertiesService.getScriptProperties();
    for (const name of [
      AKB.properties.spreadsheetId,
      AKB.properties.serviceToken,
      AKB.properties.signingSecret,
    ]) {
      if (!properties.getProperty(name))
        throw new Error("configuration_missing");
    }
    stage = "spreadsheet";
    const spreadsheet = getSpreadsheet_();
    stage = "sheet_headers";
    Object.entries(AKB.sheets).forEach(([name, headers]) => {
      const sheet = spreadsheet.getSheetByName(name);
      if (!sheet) throw new Error("required_sheet_missing");
      validateHeaders_(sheet, headers);
    });
    const result = { ok: true, check: "foundation", status: "ready" };
    console.info(JSON.stringify(result));
    return result;
  } catch (error) {
    const result = {
      ok: false,
      check: "foundation",
      stage,
      code: safeErrorCode_(error),
    };
    console.error(JSON.stringify(result));
    return result;
  }
}

function rotateServiceToken() {
  const token = generateSecret_();
  PropertiesService.getScriptProperties().setProperty(
    AKB.properties.serviceToken,
    token,
  );
  return token;
}
function doGet() {
  return jsonResponse_({
    ok: true,
    service: "AKB Studio Publishing Service",
    status: "online",
  });
}
function doPost(e) {
  let stage = "request_parse";
  let action = "unknown";
  try {
    const payload = parseRequest_(e);
    stage = "service_token";
    requireServiceToken_(payload.serviceToken);
    stage = "request_signature";
    requireSignedRequest_(payload);
    action = normalizeIdentifier_(payload.action, 64);
    stage = "action_handler";
    if (action === "admin_feedback_list")
      return jsonResponse_({ ok: true, data: listFeedback_(payload) });
    if (action === "admin_feedback_get")
      return jsonResponse_({ ok: true, data: getFeedback_(payload) });
    if (
      action === "admin_feedback_update" ||
      action === "admin_feedback_delete"
    )
      return jsonResponse_({
        ok: true,
        data: changeFeedback_(payload, action),
      });
    if (action === "health") return jsonResponse_({ ok: true });
    if (action === "subscribe")
      return jsonResponse_({ ok: true, data: subscribe_(payload) });
    if (action === "vartalap_submit")
      return jsonResponse_({ ok: true, data: submitVartalap_(payload) });
    if (action === "vartalap_public")
      return jsonResponse_({ ok: true, data: getPublicVartalap_(payload) });
    if (action === "feedback_submit")
      return jsonResponse_({ ok: true, data: submitAevaFeedback_(payload) });
    if (action === "publication_event")
      return jsonResponse_({
        ok: true,
        data: createPublicationEvent_(payload),
      });
    if (
      action === "notification_status" ||
      action === "admin_notification_state"
    )
      return jsonResponse_({ ok: true, data: notificationStatus_() });
    if (action === "admin_set_setting")
      return jsonResponse_({ ok: true, data: adminSetSetting_(payload) });
    if (action === "admin_send_notifications")
      return jsonResponse_({ ok: true, data: processNotificationQueue() });
    if (action === "admin_vartalap_list")
      return jsonResponse_({ ok: true, data: adminVartalapList_() });
    if (action === "admin_vartalap_reply")
      return jsonResponse_({ ok: true, data: adminVartalapReply_(payload) });
    throw new Error("unsupported_action");
  } catch (error) {
    const code = safeErrorCode_(error);
    const knownActions = [
      "health",
      "subscribe",
      "vartalap_submit",
      "vartalap_public",
      "feedback_submit",
      "publication_event",
      "notification_status",
      "admin_notification_state",
      "admin_set_setting",
      "admin_send_notifications",
      "admin_vartalap_list",
      "admin_vartalap_reply",
      "admin_feedback_list",
      "admin_feedback_get",
      "admin_feedback_update",
      "admin_feedback_delete",
    ];
    console.error(
      JSON.stringify({
        event: "publishing_request_failed",
        stage,
        action: knownActions.includes(action) ? action : "unknown",
        code,
      }),
    );
    return jsonResponse_({ ok: false, error: code });
  }
}
function subscribe_(payload) {
  const email = normalizeEmail_(payload.email);
  const journal = normalizeBoolean_(payload.journal);
  const knowledge = normalizeBoolean_(payload.knowledge);
  if (!journal && !knowledge) throw new Error("invalid_preferences");
  const sheet = getSheet_("Subscribers");
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const rows = readRows_(sheet, AKB.sheets.Subscribers);
    const existing = rows.find(
      (row) => normalizeEmailLoose_(row.email) === email,
    );
    if (existing) {
      updateRowById_(sheet, "subscriberId", existing.subscriberId, {
        journal,
        knowledge,
        status: "active",
        unsubscribedAt: "",
      });
      return { status: "updated" };
    }
    appendPrivateRow_("Subscribers", {
      subscriberId: generateId_("sub"),
      email,
      journal,
      knowledge,
      status: "active",
      subscribedAt: nowIso_(),
      unsubscribedAt: "",
      lastDigestAt: "",
    });
    return { status: "created" };
  } finally {
    lock.releaseLock();
  }
}
function submitVartalap_(payload) {
  if (!settingBoolean_("vartalap.acceptingQuestions"))
    throw new Error("vartalap_closed");
  appendPrivateRow_("Vartalap", {
    questionId: generateId_("q"),
    contentId: normalizeIdentifier_(payload.contentId, 100),
    contentType: normalizeIdentifier_(payload.contentType, 32),
    contentSlug: normalizeSlug_(payload.contentSlug),
    name: normalizeText_(payload.name, 80),
    email: normalizeEmail_(payload.email),
    question: normalizeText_(payload.question, 2000),
    anonymous: normalizeBoolean_(payload.anonymous),
    submittedAt: nowIso_(),
    status: "pending",
    reply: "",
    repliedAt: "",
    public: false,
    publishedAt: "",
  });
  return { status: "submitted" };
}
function submitAevaFeedback_(payload) {
  const allowedRatings = new Set(["helpful", "not-helpful", "mixed"]);
  const allowedReasons = new Set([
    "helpful",
    "not-helpful",
    "incorrect",
    "too-much-detail",
    "not-enough-detail",
    "privacy-concern",
    "irrelevant",
    "unsafe",
    "broken-conversation",
    "other",
  ]);
  const kind =
    payload.kind == null ? "feedback" : normalizeIdentifier_(payload.kind, 16);
  const rating = normalizeIdentifier_(payload.rating, 24);
  const reason = normalizeIdentifier_(payload.reason, 40);
  if (!["feedback", "report"].includes(kind))
    throw new Error("invalid_feedback");
  if (!allowedRatings.has(rating)) throw new Error("invalid_feedback");
  if (!allowedReasons.has(reason)) throw new Error("invalid_feedback");
  const transcriptConsented =
    kind === "report" && payload.transcriptConsented === true;
  const reportExcerpt = transcriptConsented
    ? normalizeText_(payload.reportExcerpt, 4000)
    : "";
  const priority = ["privacy-concern", "unsafe"].includes(reason)
    ? "urgent"
    : "normal";
  const record = {
    feedbackId: generateId_("fdb"),
    rating,
    message: normalizeOptionalText_(payload.message, 500),
    conversationId: normalizeOptionalText_(payload.conversationId, 80),
    page: normalizeOptionalText_(payload.page, 300) || "/aeva",
    policyVersion: normalizeText_(payload.policyVersion, 80),
    submittedAt: nowIso_(),
    reason,
    responseId: normalizeIdentifier_(payload.responseId, 80),
    priority,
    kind,
    transcriptConsented,
    reportExcerpt,
  };
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) throw new Error("service_busy");
  try {
    const sheet = ensureFeedbackSheet_(getSpreadsheet_());
    sheet.appendRow(
      AKB.sheets.AevaFeedback.map((header) =>
        privateSheetCell_(record[header] == null ? "" : record[header]),
      ),
    );
    return { status: "submitted" };
  } finally {
    lock.releaseLock();
  }
}
function getPublicVartalap_(payload) {
  if (!settingBoolean_("vartalap.publicRepliesEnabled")) return [];
  const contentId = normalizeIdentifier_(payload.contentId, 100);
  return readRows_(getSheet_("Vartalap"), AKB.sheets.Vartalap)
    .filter(
      (row) =>
        String(row.contentId) === contentId &&
        String(row.public).toLowerCase() === "true" &&
        String(row.status) === "replied" &&
        String(row.reply || "").trim(),
    )
    .map((row) => ({
      questionId: String(row.questionId),
      displayName:
        String(row.anonymous).toLowerCase() === "true"
          ? "Anonymous reader"
          : String(row.name),
      question: String(row.question),
      reply: String(row.reply),
      publishedAt: String(row.publishedAt || row.repliedAt),
    }));
}
function createPublicationEvent_(payload) {
  const notificationRequested = normalizeBoolean_(
    payload.notificationRequested,
  );
  if (!notificationRequested) return { status: "notification_skipped" };
  const contentType = normalizeIdentifier_(payload.contentType, 32);
  if (!["journal", "knowledge"].includes(contentType))
    throw new Error("invalid_content_type");
  const publishedAt = normalizeIsoDate_(payload.publishedAt);
  const delayHours = Number(getSetting_("notification.defaultDelayHours"));
  const eligibleAt = new Date(
    new Date(publishedAt).getTime() + delayHours * 3600000,
  ).toISOString();
  appendPrivateRow_("PublicationEvents", {
    eventId: generateId_("evt"),
    publicationId: normalizeIdentifier_(payload.publicationId, 100),
    contentType,
    slug: normalizeSlug_(payload.slug),
    title: normalizeText_(payload.title, 180),
    publishedAt,
    notificationRequested: true,
    eligibleAt,
    status: "scheduled",
    digestId: "",
    cancelledAt: "",
  });
  return { status: "scheduled", eligibleAt };
}
function notificationStatus_() {
  const events = readRows_(
    getSheet_("PublicationEvents"),
    AKB.sheets.PublicationEvents,
  );
  const queue = readRows_(
    getSheet_("NotificationQueue"),
    AKB.sheets.NotificationQueue,
  );
  return {
    journalKnowledgeHold: settingBoolean_("notification.journalKnowledgeHold"),
    globalMailHold: settingBoolean_("notification.globalMailHold"),
    scheduled: events.filter((row) => row.status === "scheduled").length,
    held: events.filter((row) => row.status === "held").length,
    queued: queue.filter((row) => row.status === "queued").length,
    remainingDailyQuota: MailApp.getRemainingDailyQuota(),
  };
}
function processNotificationQueue() {
  if (settingBoolean_("notification.globalMailHold"))
    return { ok: true, status: "global_hold" };
  const eventsSheet = getSheet_("PublicationEvents");
  const now = new Date();
  const eligible = readRows_(eventsSheet, AKB.sheets.PublicationEvents).filter(
    (row) =>
      ["scheduled", "held"].includes(String(row.status)) &&
      new Date(String(row.eligibleAt)).getTime() <= now.getTime(),
  );
  if (!eligible.length) return { ok: true, status: "nothing_eligible" };
  if (settingBoolean_("notification.journalKnowledgeHold")) {
    eligible.forEach((event) =>
      updateRowById_(eventsSheet, "eventId", event.eventId, { status: "held" }),
    );
    return {
      ok: true,
      status: "journal_knowledge_hold",
      held: eligible.length,
    };
  }
  const digestId = generateId_("dig");
  eligible.forEach((event) =>
    updateRowById_(eventsSheet, "eventId", event.eventId, {
      status: "queued",
      digestId,
    }),
  );
  const subscribers = readRows_(
    getSheet_("Subscribers"),
    AKB.sheets.Subscribers,
  ).filter((row) => row.status === "active");
  subscribers.forEach((subscriber) => {
    const audienceEvents = eligible.filter((event) =>
      event.contentType === "journal"
        ? String(subscriber.journal).toLowerCase() === "true"
        : String(subscriber.knowledge).toLowerCase() === "true",
    );
    if (!audienceEvents.length) return;
    appendPrivateRow_("NotificationQueue", {
      digestId,
      subscriberId: subscriber.subscriberId,
      publicationIds: audienceEvents
        .map((event) => String(event.publicationId))
        .join(","),
      audience: audienceEvents
        .map((event) => String(event.contentType))
        .filter((value, index, list) => list.indexOf(value) === index)
        .join(","),
      status: "queued",
      scheduledAt: now.toISOString(),
      sentAt: "",
      attemptCount: 0,
      nextAttemptAt: now.toISOString(),
      lastErrorCode: "",
    });
  });
  return sendAvailableNotificationBatch_();
}
function sendAvailableNotificationBatch_() {
  if (settingBoolean_("notification.globalMailHold"))
    return { status: "global_hold", sent: 0 };
  const usable = Math.max(
    0,
    MailApp.getRemainingDailyQuota() -
      Number(getSetting_("notification.dailyReserve")),
  );
  if (usable < 1) return { status: "quota_reserved", sent: 0 };
  const queueSheet = getSheet_("NotificationQueue");
  const queue = readRows_(queueSheet, AKB.sheets.NotificationQueue)
    .filter((row) => row.status === "queued")
    .sort(
      (a, b) =>
        new Date(String(a.scheduledAt)).getTime() -
        new Date(String(b.scheduledAt)).getTime(),
    );
  const subscribers = readRows_(
    getSheet_("Subscribers"),
    AKB.sheets.Subscribers,
  );
  const publications = readRows_(
    getSheet_("PublicationEvents"),
    AKB.sheets.PublicationEvents,
  );
  let sent = 0;
  for (const delivery of queue) {
    if (sent >= usable) break;
    const subscriber = subscribers.find(
      (row) => row.subscriberId === delivery.subscriberId,
    );
    if (!subscriber || subscriber.status !== "active") {
      updateRowByCompoundKey_(
        queueSheet,
        ["digestId", "subscriberId"],
        [delivery.digestId, delivery.subscriberId],
        { status: "cancelled", lastErrorCode: "SUBSCRIBER_INACTIVE" },
      );
      continue;
    }
    const ids = String(delivery.publicationIds)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const items = publications.filter((event) =>
      ids.includes(String(event.publicationId)),
    );
    if (!items.length) continue;
    try {
      MailApp.sendEmail({
        to: String(subscriber.email),
        subject:
          items.length === 1
            ? `New from AKB Studio · ${items[0].title}`
            : "New Journal & Knowledge from AKB Studio",
        body: buildDigestText_(items),
        name: "AKB Studio",
      });
      updateRowByCompoundKey_(
        queueSheet,
        ["digestId", "subscriberId"],
        [delivery.digestId, delivery.subscriberId],
        {
          status: "sent",
          sentAt: nowIso_(),
          attemptCount: Number(delivery.attemptCount || 0) + 1,
          nextAttemptAt: "",
          lastErrorCode: "",
        },
      );
      appendPrivateRow_("DeliveryLog", {
        deliveryId: generateId_("del"),
        digestId: delivery.digestId,
        subscriberId: delivery.subscriberId,
        status: "sent",
        attemptedAt: nowIso_(),
        sentAt: nowIso_(),
        errorCode: "",
      });
      sent += 1;
    } catch (error) {
      updateRowByCompoundKey_(
        queueSheet,
        ["digestId", "subscriberId"],
        [delivery.digestId, delivery.subscriberId],
        {
          status: "queued",
          attemptCount: Number(delivery.attemptCount || 0) + 1,
          nextAttemptAt: new Date(Date.now() + 3600000).toISOString(),
          lastErrorCode: "MAIL_SEND_FAILED",
        },
      );
      appendPrivateRow_("DeliveryLog", {
        deliveryId: generateId_("del"),
        digestId: delivery.digestId,
        subscriberId: delivery.subscriberId,
        status: "failed",
        attemptedAt: nowIso_(),
        sentAt: "",
        errorCode: "MAIL_SEND_FAILED",
      });
    }
  }
  return {
    status: "processed",
    sent,
    remainingDailyQuota: MailApp.getRemainingDailyQuota(),
  };
}
function buildDigestText_(items) {
  const lines = [
    "AKB Studio",
    "",
    items.length === 1 ? "New publication" : "New publications",
    "",
  ];
  items.forEach((item) => {
    lines.push(
      String(item.contentType).toUpperCase(),
      String(item.title),
      `/${String(item.contentType)}/${String(item.slug)}`,
      "",
    );
  });
  lines.push("You are receiving this because you subscribed to AKB Studio.");
  return lines.join("\n");
}
function adminSetSetting_(payload) {
  const key = String(payload.key || "");
  if (
    ![
      "notification.journalKnowledgeHold",
      "notification.globalMailHold",
    ].includes(key)
  )
    throw new Error("invalid_setting");
  const value = normalizeBoolean_(payload.value);
  const sheet = getSheet_("Settings");
  const rows = readRows_(sheet, AKB.sheets.Settings);
  const index = rows.findIndex((row) => String(row.key) === key);
  if (index >= 0) sheet.getRange(index + 2, 2).setValue(value);
  else sheet.appendRow([key, value]);
  return { key, value };
}
function adminVartalapList_() {
  return readRows_(getSheet_("Vartalap"), AKB.sheets.Vartalap)
    .filter((row) => row.status !== "archived")
    .map((row) => ({
      questionId: String(row.questionId),
      contentId: String(row.contentId),
      contentType: String(row.contentType),
      contentSlug: String(row.contentSlug),
      name: String(row.name),
      question: String(row.question),
      anonymous: String(row.anonymous).toLowerCase() === "true",
      submittedAt: String(row.submittedAt),
      status: String(row.status),
      reply: String(row.reply || ""),
      public: String(row.public).toLowerCase() === "true",
    }));
}
function adminVartalapReply_(payload) {
  const questionId = normalizeIdentifier_(payload.questionId, 120);
  const reply = normalizeText_(payload.reply, 4000);
  const isPublic = normalizeBoolean_(payload.public);
  const now = nowIso_();
  const updated = updateRowById_(
    getSheet_("Vartalap"),
    "questionId",
    questionId,
    {
      status: "replied",
      reply,
      repliedAt: now,
      public: isPublic,
      publishedAt: isPublic ? now : "",
    },
  );
  if (!updated) throw new Error("question_not_found");
  return { status: "saved" };
}
function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(
    AKB.properties.spreadsheetId,
  );
  if (!id) throw new Error("publishing_service_not_initialized");
  return SpreadsheetApp.openById(id);
}
function getSheet_(name) {
  const sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error("required_sheet_missing");
  return sheet;
}
function validateHeaders_(sheet, expectedHeaders) {
  if (sheet.getMaxColumns() < expectedHeaders.length)
    throw new Error("sheet_header_mismatch");
  const actual = sheet
    .getRange(1, 1, 1, expectedHeaders.length)
    .getDisplayValues()[0]
    .map((value) => value.trim());
  expectedHeaders.forEach((expected, index) => {
    if (actual[index] !== expected) throw new Error("sheet_header_mismatch");
  });
}

function initializeDefaultSettings_() {
  const sheet = getSheet_("Settings");
  const existingKeys = new Set(
    readRows_(sheet, AKB.sheets.Settings).map((row) =>
      String(row.key || "").trim(),
    ),
  );
  Object.entries(AKB.settings).forEach(([key, value]) => {
    if (!existingKeys.has(key)) sheet.appendRow([key, value]);
  });
}
function getSettings_() {
  const sheet = getSheet_("Settings");
  if (sheet.getLastRow() < 2) return {};
  return sheet
    .getRange(2, 1, sheet.getLastRow() - 1, 2)
    .getValues()
    .reduce((settings, row) => {
      const key = String(row[0] || "").trim();
      if (key) settings[key] = row[1];
      return settings;
    }, {});
}
function getSetting_(key) {
  const settings = getSettings_();
  if (!(key in settings)) throw new Error("required_setting_missing");
  return settings[key];
}
function settingBoolean_(key) {
  return String(getSetting_(key)).toLowerCase() === "true";
}
function readRows_(sheet, headers) {
  if (sheet.getLastRow() < 2) return [];
  return sheet
    .getRange(2, 1, sheet.getLastRow() - 1, headers.length)
    .getValues()
    .map((row) =>
      headers.reduce((record, header, index) => {
        record[header] = row[index];
        return record;
      }, {}),
    );
}
function appendPrivateRow_(sheetName, record) {
  const headers = AKB.sheets[sheetName];
  getSheet_(sheetName).appendRow(
    headers.map((header) =>
      privateSheetCell_(
        record[header] === undefined || record[header] === null
          ? ""
          : record[header],
      ),
    ),
  );
}
function privateSheetCell_(value) {
  if (typeof value !== "string") return value;
  return /^[=+@-]/.test(value) ? `'${value}` : value;
}
function updateRowById_(sheet, idHeader, idValue, values) {
  const headers = AKB.sheets[sheet.getName()];
  const idIndex = headers.indexOf(idHeader);
  if (sheet.getLastRow() < 2) return false;
  const rows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, headers.length)
    .getValues();
  const index = rows.findIndex(
    (row) => String(row[idIndex]) === String(idValue),
  );
  if (index < 0) return false;
  Object.entries(values).forEach(([key, value]) => {
    const column = headers.indexOf(key);
    if (column >= 0)
      sheet.getRange(index + 2, column + 1).setValue(privateSheetCell_(value));
  });
  return true;
}
function updateRowByCompoundKey_(sheet, keyHeaders, keyValues, values) {
  const headers = AKB.sheets[sheet.getName()];
  if (sheet.getLastRow() < 2) return false;
  const rows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, headers.length)
    .getValues();
  const index = rows.findIndex((row) =>
    keyHeaders.every(
      (header, position) =>
        String(row[headers.indexOf(header)]) === String(keyValues[position]),
    ),
  );
  if (index < 0) return false;
  Object.entries(values).forEach(([key, value]) => {
    const column = headers.indexOf(key);
    if (column >= 0)
      sheet.getRange(index + 2, column + 1).setValue(privateSheetCell_(value));
  });
  return true;
}
function parseRequest_(e) {
  if (!e || !e.postData || !e.postData.contents)
    throw new Error("invalid_request");
  if (e.postData.length > 32768) throw new Error("request_too_large");
  const payload = JSON.parse(e.postData.contents);
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw new Error("invalid_payload");
  return payload;
}
function requireServiceToken_(provided) {
  const expected = PropertiesService.getScriptProperties().getProperty(
    AKB.properties.serviceToken,
  );
  if (
    !expected ||
    typeof provided !== "string" ||
    !secureEquals_(expected, provided)
  )
    throw new Error("unauthorized");
}
function requireSignedRequest_(payload) {
  const signingSecret = PropertiesService.getScriptProperties().getProperty(
    AKB.properties.signingSecret,
  );
  const timestamp = payload.timestamp;
  const providedSignature = payload.signature;
  if (!signingSecret) throw new Error("unauthorized");
  if (
    typeof timestamp !== "number" ||
    !Number.isFinite(timestamp) ||
    !Number.isInteger(timestamp)
  )
    throw new Error("unauthorized");
  if (
    typeof providedSignature !== "string" ||
    !/^[a-f0-9]{64}$/.test(providedSignature)
  )
    throw new Error("unauthorized");
  if (Math.abs(Date.now() - timestamp) > AKB.security.requestMaxAgeMs)
    throw new Error("unauthorized");
  const unsignedPayload = {};
  Object.keys(payload).forEach((key) => {
    if (key !== "serviceToken" && key !== "timestamp" && key !== "signature") {
      unsignedPayload[key] = payload[key];
    }
  });
  const signingInput = `${timestamp}.${stableJson_(unsignedPayload)}`;
  const expectedSignature = hmacSha256Hex_(signingInput, signingSecret);
  if (!secureEquals_(expectedSignature, providedSignature))
    throw new Error("unauthorized");
}
function stableJson_(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson_).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => `${JSON.stringify(key)}:${stableJson_(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}
function hmacSha256Hex_(message, secret) {
  return Utilities.computeHmacSha256Signature(
    message,
    secret,
    Utilities.Charset.UTF_8,
  )
    .map((byte) => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, "0"))
    .join("");
}
function secureEquals_(left, right) {
  const leftDigest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(left),
  );
  const rightDigest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(right),
  );
  let difference = 0;
  for (let index = 0; index < leftDigest.length; index += 1)
    difference |= leftDigest[index] ^ rightDigest[index];
  return difference === 0;
}
function normalizeEmail_(value) {
  const email = String(value || "")
    .trim()
    .toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    throw new Error("invalid_email");
  return email;
}
function normalizeEmailLoose_(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}
function normalizeText_(value, maxLength) {
  const text = String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!text || text.length > maxLength) throw new Error("invalid_text");
  return text;
}
function normalizeOptionalText_(value, maxLength) {
  const text = String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (text.length > maxLength) throw new Error("invalid_text");
  return text;
}
function normalizeIdentifier_(value, maxLength) {
  const identifier = String(value || "").trim();
  if (
    !identifier ||
    identifier.length > maxLength ||
    !/^[a-zA-Z0-9._:-]+$/.test(identifier)
  )
    throw new Error("invalid_identifier");
  return identifier;
}
function normalizeSlug_(value) {
  const slug = String(value || "").trim();
  if (!/^[a-z0-9-]{1,160}$/.test(slug)) throw new Error("invalid_slug");
  return slug;
}
function normalizeBoolean_(value) {
  if (value === true || value === "true" || value === 1 || value === "1")
    return true;
  if (value === false || value === "false" || value === 0 || value === "0")
    return false;
  throw new Error("invalid_boolean");
}
function normalizeIsoDate_(value) {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) throw new Error("invalid_date");
  return date.toISOString();
}
function generateId_(prefix) {
  return `${prefix}_${Utilities.getUuid().replace(/-/g, "")}`;
}
function generateSecret_() {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    [
      Utilities.getUuid(),
      Utilities.getUuid(),
      Utilities.getUuid(),
      Date.now(),
    ].join(":"),
  );
  return Utilities.base64EncodeWebSafe(digest).replace(/=+$/g, "");
}
function nowIso_() {
  return new Date().toISOString();
}
function safeErrorCode_(error) {
  const allowed = new Set([
    "record_not_found",
    "record_changed",
    "invalid_confirmation",
    "configuration_missing",
    "spreadsheet_not_configured",
    "publishing_service_not_initialized",
    "required_sheet_missing",
    "required_setting_missing",
    "sheet_header_mismatch",
    "service_busy",
    "invalid_request",
    "request_too_large",
    "invalid_payload",
    "invalid_email",
    "invalid_preferences",
    "invalid_text",
    "invalid_identifier",
    "invalid_slug",
    "invalid_boolean",
    "invalid_date",
    "invalid_content_type",
    "invalid_setting",
    "invalid_feedback",
    "question_not_found",
    "unauthorized",
    "vartalap_closed",
    "unsupported_action",
  ]);
  const message =
    error && typeof error.message === "string"
      ? error.message
      : "internal_error";
  return allowed.has(message) ? message : "internal_error";
}
function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function ensureFeedbackSheet_(spreadsheet) {
  const name = "AevaFeedback";
  const headers = AKB.sheets.AevaFeedback;
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    if (sheet.getMaxColumns() < headers.length)
      sheet.insertColumnsAfter(
        sheet.getMaxColumns(),
        headers.length - sheet.getMaxColumns(),
      );
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return sheet;
  }
  const width = sheet.getLastColumn();
  const actual = sheet
    .getRange(1, 1, 1, width)
    .getDisplayValues()[0]
    .map((value) => value.trim());
  const shared = Math.min(width, headers.length);
  for (let index = 0; index < shared; index++) {
    if (actual[index] !== headers[index])
      throw new Error("sheet_header_mismatch");
  }
  if (width < headers.length) {
    if (sheet.getMaxColumns() < headers.length)
      sheet.insertColumnsAfter(
        sheet.getMaxColumns(),
        headers.length - sheet.getMaxColumns(),
      );
    sheet
      .getRange(1, width + 1, 1, headers.length - width)
      .setValues([headers.slice(width)]);
  }
  validateHeaders_(sheet, headers);
  return sheet;
}

function feedbackRevision_(values) {
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    JSON.stringify(values),
    Utilities.Charset.UTF_8,
  )
    .map((byte) => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, "0"))
    .join("");
}
function feedbackRecord_(values, includeExcerpt) {
  const headers = AKB.sheets.AevaFeedback;
  const record = {};
  headers.forEach((header, index) => {
    record[header] = values[index] == null ? "" : values[index];
  });
  record.status = record.status || "new";
  record.kind = record.kind || "feedback";
  record.transcriptConsented =
    String(record.transcriptConsented).toLowerCase() === "true";
  if (
    !includeExcerpt ||
    record.kind !== "report" ||
    !record.transcriptConsented
  )
    delete record.reportExcerpt;
  record.revision = feedbackRevision_(values);
  return record;
}
function withFeedbackLock_(operation) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) throw new Error("service_busy");
  try {
    return operation(ensureFeedbackSheet_(getSpreadsheet_()));
  } finally {
    lock.releaseLock();
  }
}
function listFeedback_(payload) {
  const limit = 25;
  return withFeedbackLock_((sheet) => {
    const cursor =
      payload.cursor == null ? sheet.getLastRow() + 1 : Number(payload.cursor);
    if (!Number.isSafeInteger(cursor) || cursor < 2)
      throw new Error("invalid_request");
    const end = Math.min(cursor - 1, sheet.getLastRow());
    if (end < 2) return { items: [], nextCursor: null };
    const start = Math.max(2, end - limit + 1);
    const rows = sheet
      .getRange(start, 1, end - start + 1, AKB.sheets.AevaFeedback.length)
      .getValues();
    return {
      items: rows
        .reverse()
        .filter((row) => row[0])
        .map((row) => feedbackRecord_(row, false)),
      nextCursor: start > 2 ? start : null,
    };
  });
}
function findFeedback_(sheet, id) {
  const feedbackId = normalizeIdentifier_(id, 100);
  if (sheet.getLastRow() < 2) throw new Error("record_not_found");
  const match = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, 1)
    .createTextFinder(feedbackId)
    .matchEntireCell(true)
    .useRegularExpression(false)
    .findNext();
  if (!match) throw new Error("record_not_found");
  const row = match.getRow();
  const values = sheet
    .getRange(row, 1, 1, AKB.sheets.AevaFeedback.length)
    .getValues()[0];
  return { row, values };
}
function getFeedback_(payload) {
  return withFeedbackLock_((sheet) =>
    feedbackRecord_(findFeedback_(sheet, payload.id).values, true),
  );
}
function changeFeedback_(payload, action) {
  const id = normalizeIdentifier_(payload.id, 100);
  const revision = normalizeIdentifier_(payload.revision, 64);
  const operationId = normalizeIdentifier_(payload.operationId, 100);
  const actorId = normalizeIdentifier_(payload.actorId, 100);
  const isDelete = action === "admin_feedback_delete";
  if (isDelete && payload.confirmation !== id)
    throw new Error("invalid_confirmation");
  if (
    !isDelete &&
    !["new", "reviewed", "resolved", "archived"].includes(payload.status)
  )
    throw new Error("invalid_feedback");
  const note = isDelete ? "" : normalizeOptionalText_(payload.ownerNote, 2000);
  return withFeedbackLock_((sheet) => {
    const found = findFeedback_(sheet, id);
    if (feedbackRevision_(found.values) !== revision)
      throw new Error("record_changed");
    // Keep an audit trail in the same private spreadsheet, without submission text.
    const auditHeaders = [
      "operationId",
      "feedbackId",
      "actorId",
      "action",
      "outcome",
      "at",
    ];
    const spreadsheet = getSpreadsheet_();
    let audit = spreadsheet.getSheetByName("AevaFeedbackAudit");
    if (!audit) audit = spreadsheet.insertSheet("AevaFeedbackAudit");
    if (audit.getLastRow() === 0) audit.appendRow(auditHeaders);
    validateHeaders_(audit, auditHeaders);
    audit.appendRow(
      [
        operationId,
        id,
        actorId,
        isDelete ? "delete" : "update",
        "requested",
        nowIso_(),
      ].map(privateSheetCell_),
    );
    if (isDelete) sheet.deleteRow(found.row);
    else {
      const start = AKB.sheets.AevaFeedback.indexOf("status") + 1;
      sheet
        .getRange(found.row, start, 1, 3)
        .setValues([[payload.status, privateSheetCell_(note), nowIso_()]]);
    }
    audit.appendRow(
      [
        operationId,
        id,
        actorId,
        isDelete ? "delete" : "update",
        "completed",
        nowIso_(),
      ].map(privateSheetCell_),
    );
    return { status: isDelete ? "deleted" : "updated" };
  });
}
