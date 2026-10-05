"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

type ContentState = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

export type OperationsInitialData = {
  siteConfiguration: {
    siteName: string;
    authorName: string;
    description: string;
    professionalEmail: string;
    generalEmail: string;
    socialImageAssetId: string | null;
    socialImageAlt: string | null;
  } | null;
  profile: {
    displayName: string;
    headline: string;
    biography: string;
    location: string | null;
    email: string | null;
    dpAssetId: string | null;
    state: ContentState;
  } | null;
  availability: {
    label: string;
    summary: string;
    available: boolean;
    validUntil: string | null;
    state: ContentState;
  } | null;
  projects: Array<{
    slug: string;
    title: string;
    categoryLabel: string;
    summary: string;
    disciplines: string[];
    tier: string;
    lifecycle: string;
    role: string | null;
    period: string | null;
    technologies: string[];
    repositoryUrl: string | null;
    demoUrl: string | null;
    coverAssetId: string | null;
    order: number;
    homepageOrder: number | null;
    featured: boolean;
    aevaApproved: boolean;
    state: ContentState;
  }>;
  reflections: Array<{
    slug: string;
    sanskrit: string;
    transliteration: string;
    translation: string;
    interpretation: string;
    source: string | null;
    reflectionDate: string | null;
    state: ContentState;
  }>;
  galleries: Array<{
    slug: string;
    title: string;
    description: string | null;
    state: ContentState;
    items: Array<{
      id: string;
      assetId: string;
      label: string;
      altText: string;
      caption: string | null;
      order: number;
    }>;
  }>;
  mediaAssets: Array<{
    id: string;
    label: string;
    mimeType: string;
  }>;
};

export type OperationsSection =
  | "all"
  | "site"
  | "profile"
  | "availability"
  | "projects"
  | "reflections"
  | "galleries";

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

function StateSelect({ value = "DRAFT" }: { value?: ContentState }) {
  return (
    <label>
      <span>Publishing state</span>
      <select name="state" defaultValue={value}>
        <option>DRAFT</option>
        <option>SCHEDULED</option>
        <option>PUBLISHED</option>
        <option>ARCHIVED</option>
      </select>
    </label>
  );
}

function MediaSelect({
  name,
  value,
  assets,
  kind = "image",
  required = false,
}: {
  name: string;
  value?: string | null;
  assets: OperationsInitialData["mediaAssets"];
  kind?: "image" | "all";
  required?: boolean;
}) {
  const options = assets.filter(
    (asset) => kind === "all" || asset.mimeType.startsWith("image/"),
  );
  return (
    <select name={name} defaultValue={value ?? ""} required={required}>
      <option value="">No asset selected</option>
      {options.map((asset) => (
        <option key={asset.id} value={asset.id}>
          {asset.label} · {asset.mimeType}
        </option>
      ))}
    </select>
  );
}

function localDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function OperationsConsole({
  initialData,
  section = "all",
}: {
  initialData: OperationsInitialData;
  section?: OperationsSection;
}) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [reflectionSlug, setReflectionSlug] = useState("");
  const [gallerySlug, setGallerySlug] = useState("");
  const selectedProject = initialData.projects.find(
    (item) => item.slug === projectSlug,
  );
  const selectedReflection = initialData.reflections.find(
    (item) => item.slug === reflectionSlug,
  );
  const selectedGallery = initialData.galleries.find(
    (item) => item.slug === gallerySlug,
  );
  async function run(
    event: FormEvent<HTMLFormElement>,
    build: (
      data: Record<string, FormDataEntryValue>,
    ) => Record<string, unknown>,
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const formValues = values(form);
    setStatus("Saving…");
    try {
      await send(build(formValues));
      setStatus("Saved and recorded in the audit log.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    }
  }
  return (
    <div className="akb-admin-operations">
      <output aria-live="polite">{status}</output>
      <section hidden={section !== "all" && section !== "site"}>
        <h2>Site identity and sharing preview</h2>
        <form
          onSubmit={(event) =>
            run(event, (d) => ({
              resource: "site-configuration",
              siteName: d.siteName,
              authorName: d.authorName,
              description: d.description,
              professionalEmail: d.professionalEmail,
              generalEmail: d.generalEmail,
              socialImageAssetId: d.socialImageAssetId || undefined,
              socialImageAlt: d.socialImageAlt || undefined,
            }))
          }
        >
          <label>
            <span>Site name</span>
            <input
              name="siteName"
              defaultValue={
                initialData.siteConfiguration?.siteName ?? "AKB Studio"
              }
              required
            />
          </label>
          <label>
            <span>Public author name</span>
            <input
              name="authorName"
              defaultValue={
                initialData.siteConfiguration?.authorName ??
                "Anurag Kumar Bharti"
              }
              required
            />
          </label>
          <label className="akb-admin-span-2">
            <span>Default site description</span>
            <textarea
              name="description"
              defaultValue={initialData.siteConfiguration?.description}
              required
            />
          </label>
          <label>
            <span>Professional public email</span>
            <input
              type="email"
              name="professionalEmail"
              defaultValue={initialData.siteConfiguration?.professionalEmail}
              required
            />
          </label>
          <label>
            <span>General public email</span>
            <input
              type="email"
              name="generalEmail"
              defaultValue={initialData.siteConfiguration?.generalEmail}
              required
            />
          </label>
          <div className="akb-admin-field">
            <span>Social preview image</span>
            <MediaSelect
              name="socialImageAssetId"
              value={initialData.siteConfiguration?.socialImageAssetId}
              assets={initialData.mediaAssets}
            />
          </div>
          <label>
            <span>Social preview image description</span>
            <input
              name="socialImageAlt"
              defaultValue={initialData.siteConfiguration?.socialImageAlt ?? ""}
            />
          </label>
          <button type="submit">Save site settings</button>
        </form>
      </section>
      <section hidden={section !== "all" && section !== "profile"}>
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
            <input
              name="displayName"
              defaultValue={initialData.profile?.displayName}
              required
            />
          </label>
          <label>
            <span>Headline</span>
            <input
              name="headline"
              defaultValue={initialData.profile?.headline}
              required
            />
          </label>
          <label>
            <span>Biography</span>
            <textarea
              name="biography"
              defaultValue={initialData.profile?.biography}
              required
            />
          </label>
          <label>
            <span>Location</span>
            <input
              name="location"
              defaultValue={initialData.profile?.location ?? ""}
            />
          </label>
          <label>
            <span>Public email</span>
            <input
              name="email"
              type="email"
              defaultValue={initialData.profile?.email ?? ""}
            />
          </label>
          <div className="akb-admin-field">
            <span>Profile image</span>
            <MediaSelect
              name="dpAssetId"
              value={initialData.profile?.dpAssetId}
              assets={initialData.mediaAssets}
            />
          </div>
          <StateSelect value={initialData.profile?.state} />
          <button type="submit">Save profile</button>
        </form>
      </section>
      <section hidden={section !== "all" && section !== "availability"}>
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
            <input
              name="label"
              defaultValue={initialData.availability?.label}
              required
            />
          </label>
          <label>
            <span>Summary</span>
            <textarea
              name="summary"
              defaultValue={initialData.availability?.summary}
              required
            />
          </label>
          <label>
            <input
              name="available"
              type="checkbox"
              defaultChecked={initialData.availability?.available}
            />{" "}
            Available for opportunities
          </label>
          <label>
            <span>Public status expires</span>
            <input
              name="validUntil"
              type="datetime-local"
              defaultValue={localDateTime(initialData.availability?.validUntil)}
              required
            />
          </label>
          <StateSelect value={initialData.availability?.state} />
          <button type="submit">Update availability</button>
        </form>
      </section>
      <section hidden={section !== "all" && section !== "projects"}>
        <h2>Project registry</h2>
        <label>
          <span>Edit an existing project or create a new one</span>
          <select
            value={projectSlug}
            onChange={(event) => setProjectSlug(event.target.value)}
          >
            <option value="">Create a new project</option>
            {initialData.projects.map((project) => (
              <option key={project.slug} value={project.slug}>
                {project.title} ({project.slug})
              </option>
            ))}
          </select>
        </label>
        <form
          key={selectedProject?.slug ?? "new-project"}
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
              homepageOrder: d.homepageOrder ? Number(d.homepageOrder) : null,
              featured: d.featured === "on",
              aevaApproved: d.aevaApproved === "on",
              state: d.state,
            }))
          }
        >
          <label>
            <span>Slug</span>
            <input name="slug" defaultValue={selectedProject?.slug} required />
          </label>
          <label>
            <span>Title</span>
            <input
              name="title"
              defaultValue={selectedProject?.title}
              required
            />
          </label>
          <label>
            <span>Category</span>
            <input
              name="categoryLabel"
              defaultValue={selectedProject?.categoryLabel}
              required
            />
          </label>
          <label>
            <span>Summary</span>
            <textarea
              name="summary"
              defaultValue={selectedProject?.summary}
              required
            />
          </label>
          <label>
            <span>Disciplines, comma separated</span>
            <input
              name="disciplines"
              placeholder="software, ai"
              defaultValue={selectedProject?.disciplines.join(", ")}
              required
            />
          </label>
          <label>
            <span>Tier</span>
            <select name="tier" defaultValue={selectedProject?.tier}>
              <option>flagship</option>
              <option>standard</option>
              <option>compact</option>
              <option>experiment</option>
            </select>
          </label>
          <label>
            <span>Lifecycle</span>
            <select
              name="lifecycle"
              defaultValue={selectedProject?.lifecycle ?? "active"}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In progress</option>
              <option value="under-review">Under review</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label>
            <span>Role</span>
            <input name="role" defaultValue={selectedProject?.role ?? ""} />
          </label>
          <label>
            <span>Period</span>
            <input name="period" defaultValue={selectedProject?.period ?? ""} />
          </label>
          <label>
            <span>Technologies, comma separated</span>
            <input
              name="technologies"
              defaultValue={selectedProject?.technologies.join(", ")}
              required
            />
          </label>
          <label>
            <span>Repository URL</span>
            <input
              name="repositoryUrl"
              type="url"
              defaultValue={selectedProject?.repositoryUrl ?? ""}
            />
          </label>
          <label>
            <span>Demo URL</span>
            <input
              name="demoUrl"
              type="url"
              defaultValue={selectedProject?.demoUrl ?? ""}
            />
          </label>
          <div className="akb-admin-field">
            <span>Project cover</span>
            <MediaSelect
              name="coverAssetId"
              value={selectedProject?.coverAssetId}
              assets={initialData.mediaAssets}
            />
          </div>
          <label>
            <span>Order</span>
            <input
              name="order"
              type="number"
              min="0"
              defaultValue={selectedProject?.order ?? 0}
            />
          </label>
          <label>
            <span>Homepage order (optional)</span>
            <input
              name="homepageOrder"
              type="number"
              min="1"
              max="99"
              defaultValue={selectedProject?.homepageOrder ?? ""}
            />
          </label>
          <label>
            <input
              name="featured"
              type="checkbox"
              defaultChecked={selectedProject?.featured}
            />{" "}
            Featured
          </label>
          <label>
            <input
              name="aevaApproved"
              type="checkbox"
              defaultChecked={selectedProject?.aevaApproved}
            />{" "}
            Approved for Aeva
          </label>
          <StateSelect value={selectedProject?.state} />
          <button type="submit">Save project</button>
        </form>
      </section>
      <section hidden={section !== "all" && section !== "reflections"}>
        <h2>Daily Sanskrit Reflection</h2>
        <label>
          <span>Edit an existing reflection or create a new one</span>
          <select
            value={reflectionSlug}
            onChange={(event) => setReflectionSlug(event.target.value)}
          >
            <option value="">Create a new reflection</option>
            {initialData.reflections.map((reflection) => (
              <option key={reflection.slug} value={reflection.slug}>
                {reflection.slug}
              </option>
            ))}
          </select>
        </label>
        <form
          key={selectedReflection?.slug ?? "new-reflection"}
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
            <input
              name="slug"
              defaultValue={selectedReflection?.slug}
              required
            />
          </label>
          <label>
            <span>Sanskrit</span>
            <textarea
              name="sanskrit"
              defaultValue={selectedReflection?.sanskrit}
              required
            />
          </label>
          <label>
            <span>Transliteration</span>
            <textarea
              name="transliteration"
              defaultValue={selectedReflection?.transliteration}
              required
            />
          </label>
          <label>
            <span>Translation</span>
            <textarea
              name="translation"
              defaultValue={selectedReflection?.translation}
              required
            />
          </label>
          <label>
            <span>Interpretation</span>
            <textarea
              name="interpretation"
              defaultValue={selectedReflection?.interpretation}
              required
            />
          </label>
          <label>
            <span>Source</span>
            <input
              name="source"
              defaultValue={selectedReflection?.source ?? ""}
            />
          </label>
          <label>
            <span>Reflection date</span>
            <input
              name="reflectionDate"
              type="date"
              defaultValue={selectedReflection?.reflectionDate?.slice(0, 10)}
            />
          </label>
          <StateSelect value={selectedReflection?.state} />
          <button type="submit">Save reflection</button>
        </form>
      </section>
      <section hidden={section !== "all" && section !== "galleries"}>
        <h2>Creative gallery</h2>
        <label>
          <span>Edit an existing gallery or create a new one</span>
          <select
            value={gallerySlug}
            onChange={(event) => setGallerySlug(event.target.value)}
          >
            <option value="">Create a new gallery</option>
            {initialData.galleries.map((gallery) => (
              <option key={gallery.slug} value={gallery.slug}>
                {gallery.title} ({gallery.slug})
              </option>
            ))}
          </select>
        </label>
        <form
          key={selectedGallery?.slug ?? "new-gallery"}
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
            <input name="slug" defaultValue={selectedGallery?.slug} required />
          </label>
          <label>
            <span>Title</span>
            <input
              name="title"
              defaultValue={selectedGallery?.title}
              required
            />
          </label>
          <label>
            <span>Description</span>
            <textarea
              name="description"
              defaultValue={selectedGallery?.description ?? ""}
            />
          </label>
          <StateSelect value={selectedGallery?.state} />
          <button type="submit">Save gallery</button>
        </form>
      </section>
      {selectedGallery ? (
        <section hidden={section !== "all" && section !== "galleries"}>
          <h2>Images in {selectedGallery.title}</h2>
          <p>
            The first image is the cover. Each gallery supports up to 25 images;
            visitors can swipe or use the arrow controls.
          </p>
          {selectedGallery.items.length ? (
            <div className="akb-admin-list">
              {selectedGallery.items.map((item, index) => (
                <article key={item.id}>
                  <div>
                    <p className="akb-kicker">
                      {index === 0 ? "COVER IMAGE" : `IMAGE ${index + 1}`}
                    </p>
                    <h3>{item.label}</h3>
                    <p>{item.caption || item.altText}</p>
                  </div>
                  <div className="akb-admin-actions">
                    {index !== 0 ? (
                      <button
                        type="button"
                        onClick={async () => {
                          setStatus("Changing cover…");
                          try {
                            await send({
                              resource: "gallery-item-cover",
                              gallerySlug: selectedGallery.slug,
                              itemId: item.id,
                            });
                            setStatus(
                              "Cover changed and recorded in the audit log.",
                            );
                            router.refresh();
                          } catch (error) {
                            setStatus(
                              error instanceof Error
                                ? error.message
                                : "Cover change failed",
                            );
                          }
                        }}
                      >
                        Set as cover
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={async () => {
                        setStatus("Removing image…");
                        try {
                          await send({
                            resource: "gallery-item-remove",
                            gallerySlug: selectedGallery.slug,
                            itemId: item.id,
                          });
                          setStatus(
                            "Image removed from this gallery. The media asset was kept.",
                          );
                          router.refresh();
                        } catch (error) {
                          setStatus(
                            error instanceof Error
                              ? error.message
                              : "Remove failed",
                          );
                        }
                      }}
                    >
                      Remove from gallery
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p>No images are attached to this gallery yet.</p>
          )}
        </section>
      ) : null}
      <section hidden={section !== "all" && section !== "galleries"}>
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
              defaultValue={selectedGallery?.slug ?? ""}
              required
            />
          </label>
          <div className="akb-admin-field">
            <span>Uploaded image</span>
            <MediaSelect
              name="assetId"
              assets={initialData.mediaAssets}
              required
            />
          </div>
          <label>
            <span>Alt text</span>
            <input name="altText" required />
          </label>
          <label>
            <span>Caption</span>
            <input name="caption" />
          </label>
          <label>
            <span>Order (0 is the cover)</span>
            <input
              name="order"
              type="number"
              min="0"
              max="24"
              defaultValue={selectedGallery?.items.length ?? 0}
            />
          </label>
          <button type="submit">Add image</button>
        </form>
      </section>
    </div>
  );
}
