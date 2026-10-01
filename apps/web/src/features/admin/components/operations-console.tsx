"use client";

import { type FormEvent, useState } from "react";

async function send(payload: Record<string, unknown>) {
  const response = await fetch("/api/admin/operations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Operation failed");
}

function values(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries());
}

function StateSelect() {
  return (
    <label>
      <span>Publishing state</span>
      <select name="state" defaultValue="DRAFT">
        <option>DRAFT</option>
        <option>SCHEDULED</option>
        <option>PUBLISHED</option>
        <option>ARCHIVED</option>
      </select>
    </label>
  );
}

export function OperationsConsole() {
  const [status, setStatus] = useState("");
  async function run(
    event: FormEvent<HTMLFormElement>,
    build: (
      data: Record<string, FormDataEntryValue>,
    ) => Record<string, unknown>,
  ) {
    event.preventDefault();
    setStatus("Saving…");
    try {
      await send(build(values(event.currentTarget)));
      setStatus("Saved and recorded in the audit log.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    }
  }
  return (
    <div className="akb-admin-operations">
      <output aria-live="polite">{status}</output>
      <section>
        <h2>About profile and DP</h2>
        <form
          onSubmit={(event) =>
            run(event, (d) => ({
              resource: "profile",
              displayName: d.displayName,
              headline: d.headline,
              biography: d.biography,
              location: d.location || undefined,
              email: d.email || undefined,
              dpAssetId: d.dpAssetId || undefined,
              state: d.state,
            }))
          }
        >
          <label>
            <span>Display name</span>
            <input name="displayName" required />
          </label>
          <label>
            <span>Headline</span>
            <input name="headline" required />
          </label>
          <label>
            <span>Biography</span>
            <textarea name="biography" required />
          </label>
          <label>
            <span>Location</span>
            <input name="location" />
          </label>
          <label>
            <span>Public email</span>
            <input name="email" type="email" />
          </label>
          <label>
            <span>DP media asset ID</span>
            <input name="dpAssetId" />
          </label>
          <StateSelect />
          <button type="submit">Save profile</button>
        </form>
      </section>
      <section>
        <h2>Availability</h2>
        <form
          onSubmit={(event) =>
            run(event, (d) => ({
              resource: "availability",
              label: d.label,
              summary: d.summary,
              available: d.available === "on",
              validUntil: new Date(String(d.validUntil)).toISOString(),
              state: d.state,
            }))
          }
        >
          <label>
            <span>Status label</span>
            <input name="label" required />
          </label>
          <label>
            <span>Summary</span>
            <textarea name="summary" required />
          </label>
          <label>
            <input name="available" type="checkbox" /> Available for
            opportunities
          </label>
          <label>
            <span>Public status expires</span>
            <input name="validUntil" type="datetime-local" required />
          </label>
          <StateSelect />
          <button type="submit">Update availability</button>
        </form>
      </section>
      <section>
        <h2>Project registry</h2>
        <form
          onSubmit={(event) =>
            run(event, (d) => ({
              resource: "project",
              slug: d.slug,
              title: d.title,
              categoryLabel: d.categoryLabel,
              summary: d.summary,
              disciplines: String(d.disciplines)
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
              tier: d.tier,
              lifecycle: d.lifecycle,
              role: d.role || undefined,
              period: d.period || undefined,
              technologies: String(d.technologies)
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
              repositoryUrl: d.repositoryUrl || undefined,
              demoUrl: d.demoUrl || undefined,
              coverAssetId: d.coverAssetId || undefined,
              order: Number(d.order),
              featured: d.featured === "on",
              aevaApproved: d.aevaApproved === "on",
              state: d.state,
            }))
          }
        >
          <label>
            <span>Slug</span>
            <input name="slug" required />
          </label>
          <label>
            <span>Title</span>
            <input name="title" required />
          </label>
          <label>
            <span>Category</span>
            <input name="categoryLabel" required />
          </label>
          <label>
            <span>Summary</span>
            <textarea name="summary" required />
          </label>
          <label>
            <span>Disciplines, comma separated</span>
            <input name="disciplines" placeholder="software, ai" required />
          </label>
          <label>
            <span>Tier</span>
            <select name="tier">
              <option>flagship</option>
              <option>standard</option>
              <option>compact</option>
              <option>experiment</option>
            </select>
          </label>
          <label>
            <span>Lifecycle</span>
            <input name="lifecycle" required />
          </label>
          <label>
            <span>Role</span>
            <input name="role" />
          </label>
          <label>
            <span>Period</span>
            <input name="period" />
          </label>
          <label>
            <span>Technologies, comma separated</span>
            <input name="technologies" required />
          </label>
          <label>
            <span>Repository URL</span>
            <input name="repositoryUrl" type="url" />
          </label>
          <label>
            <span>Demo URL</span>
            <input name="demoUrl" type="url" />
          </label>
          <label>
            <span>Cover media asset ID</span>
            <input name="coverAssetId" />
          </label>
          <label>
            <span>Order</span>
            <input name="order" type="number" min="0" defaultValue="0" />
          </label>
          <label>
            <input name="featured" type="checkbox" /> Featured
          </label>
          <label>
            <input name="aevaApproved" type="checkbox" /> Approved for Aeva
          </label>
          <StateSelect />
          <button type="submit">Save project</button>
        </form>
      </section>
      <section>
        <h2>Daily Sanskrit Reflection</h2>
        <form
          onSubmit={(event) =>
            run(event, (d) => ({
              resource: "reflection",
              slug: d.slug,
              sanskrit: d.sanskrit,
              transliteration: d.transliteration,
              translation: d.translation,
              interpretation: d.interpretation,
              source: d.source || undefined,
              reflectionDate: d.reflectionDate
                ? new Date(String(d.reflectionDate)).toISOString()
                : undefined,
              state: d.state,
            }))
          }
        >
          <label>
            <span>Slug</span>
            <input name="slug" required />
          </label>
          <label>
            <span>Sanskrit</span>
            <textarea name="sanskrit" required />
          </label>
          <label>
            <span>Transliteration</span>
            <textarea name="transliteration" required />
          </label>
          <label>
            <span>Translation</span>
            <textarea name="translation" required />
          </label>
          <label>
            <span>Interpretation</span>
            <textarea name="interpretation" required />
          </label>
          <label>
            <span>Source</span>
            <input name="source" />
          </label>
          <label>
            <span>Reflection date</span>
            <input name="reflectionDate" type="date" />
          </label>
          <StateSelect />
          <button type="submit">Save reflection</button>
        </form>
      </section>
      <section>
        <h2>Creative gallery</h2>
        <form
          onSubmit={(event) =>
            run(event, (d) => ({
              resource: "gallery",
              slug: d.slug,
              title: d.title,
              description: d.description || undefined,
              state: d.state,
            }))
          }
        >
          <label>
            <span>Slug, such as travel or painting</span>
            <input name="slug" required />
          </label>
          <label>
            <span>Title</span>
            <input name="title" required />
          </label>
          <label>
            <span>Description</span>
            <textarea name="description" />
          </label>
          <StateSelect />
          <button type="submit">Save gallery</button>
        </form>
      </section>
      <section>
        <h2>Add gallery image</h2>
        <form
          onSubmit={(event) =>
            run(event, (d) => ({
              resource: "gallery-item",
              gallerySlug: d.gallerySlug,
              assetId: d.assetId,
              altText: d.altText,
              caption: d.caption || undefined,
              order: Number(d.order),
            }))
          }
        >
          <label>
            <span>Gallery slug</span>
            <input
              name="gallerySlug"
              placeholder="travel or painting"
              required
            />
          </label>
          <label>
            <span>Uploaded media asset ID</span>
            <input name="assetId" required />
          </label>
          <label>
            <span>Alt text</span>
            <input name="altText" required />
          </label>
          <label>
            <span>Caption</span>
            <input name="caption" />
          </label>
          <label>
            <span>Order</span>
            <input name="order" type="number" min="0" defaultValue="0" />
          </label>
          <button type="submit">Add image</button>
        </form>
      </section>
    </div>
  );
}
