"use server";
import * as a from "./mutations";
import { revalidatePath } from "next/cache";
import type { ContributorInput, PitchInput } from "@/lib/queries/admin";
import type { Result } from "@/components/admin/Forms";
const s = (f: FormData, key: string) => String(f.get(key) ?? "");
const checked = (f: FormData, key: string) => f.get(key) === "on";
export async function submit(
  kind: string,
  id: string,
  f: FormData,
): Promise<Result> {
  try {
    let result: unknown;
    switch (kind) {
      case "contributor": {
        const input: ContributorInput = {
          name: s(f, "name"),
          kind: s(f, "kind") as ContributorInput["kind"],
          field: s(f, "field"),
          credentials: s(f, "credentials"),
          affiliation: s(f, "affiliation"),
          region: s(f, "region"),
          bio: s(f, "bio"),
          portfolioUrl: s(f, "portfolioUrl"),
          conflicts: f
            .getAll("conflicts")
            .map(String)
            .filter((x) => x.trim()),
          active: checked(f, "active"),
        };
        result = id
          ? await a.updateContributor(id, input)
          : await a.createContributor(input);
        break;
      }
      case "verify":
        result = await a.setContributorVerified(
          id,
          s(f, "verified") === "true",
        );
        break;
      case "pitch": {
        const input: PitchInput = {
          reporterId: s(f, "reporterId"),
          topic: s(f, "topic"),
          region: s(f, "region"),
          angle: s(f, "angle"),
          timeframe: s(f, "timeframe"),
          status: (s(f, "status") || "pitched") as PitchInput["status"],
          linkedBlindspotId: s(f, "linkedBlindspotId")
            ? Number(s(f, "linkedBlindspotId"))
            : null,
        };
        result = id
          ? await a.updatePitch(id, input)
          : await a.createPitch(input);
        break;
      }
      case "publish":
        result = await a.publishPitch(id, {
          url: s(f, "url"),
          headline: s(f, "headline"),
          excerpt: s(f, "excerpt"),
        });
        break;
      case "screen":
        result = await a.rerunScreen(
          s(f, "kind") as "pitch" | "publication",
          id,
        );
        break;
      case "flag":
        result = await a.resolveFlag(
          Number(id),
          s(f, "status") as "resolved" | "dismissed",
          s(f, "note"),
        );
        break;
      case "story":
        result = await a.updateStory(id, {
          title: s(f, "title"),
          summary: s(f, "summary"),
          hidden: checked(f, "hidden"),
        });
        break;
      case "source":
        result = await a.updateSource(id, {
          type: s(f, "type"),
          ownership: s(f, "ownership"),
          ownershipSource: s(f, "ownershipSource"),
          dataStatus: s(f, "dataStatus"),
          paywalled: checked(f, "paywalled"),
          active: checked(f, "active"),
        });
        break;
      case "commentary":
        result = await a.saveCommentary(id || null, {
          storyId: s(f, "storyId"),
          contributorId: s(f, "contributorId"),
          title: s(f, "title"),
          body: s(f, "body"),
        });
        break;
      case "unpublish":
        result = await a.deleteCommentary(id);
        break;
      case "newsletter-delete":
        result = await a.deleteNewsletterSignup(id);
        break;
      case "csv":
        return {
          ok: true,
          message: "CSV exported.",
          csv: await a.exportNewsletterCsv(),
        };
      case "ingest":
        result = await a.triggerIngest();
        break;
      case "pending":
        result = await a.rescreenPending();
        break;
      default:
        throw new Error("Unknown action");
    }
    revalidatePath("/admin", "layout");
    const screen =
      result && typeof result === "object" && "screening_status" in result
        ? ` Screening: ${result.screening_status}. Only passed content is public.`
        : "";
    return {
      ok: true,
      message: `${kind === "publish" ? "Publication recorded." : "Saved successfully."}${screen}${["ingest", "pending", "screen"].includes(kind) ? `\n${JSON.stringify(result, null, 2)}` : ""}`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to save. Please try again.",
    };
  }
}
