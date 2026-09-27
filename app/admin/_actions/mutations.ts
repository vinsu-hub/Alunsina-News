"use server";
import * as admin from "@/lib/queries/admin";
import { assertAdminSession } from "@/lib/admin/session";
export async function createContributor(...args: Parameters<typeof admin.createContributor>) { await assertAdminSession(); return admin.createContributor(...args); }
export async function updateContributor(...args: Parameters<typeof admin.updateContributor>) { await assertAdminSession(); return admin.updateContributor(...args); }
export async function deleteContributor(...args: Parameters<typeof admin.deleteContributor>) { await assertAdminSession(); return admin.deleteContributor(...args); }
export async function setContributorVerified(...args: Parameters<typeof admin.setContributorVerified>) { await assertAdminSession(); return admin.setContributorVerified(...args); }
export async function createPitch(...args: Parameters<typeof admin.createPitch>) { await assertAdminSession(); return admin.createPitch(...args); }
export async function updatePitch(...args: Parameters<typeof admin.updatePitch>) { await assertAdminSession(); return admin.updatePitch(...args); }
export async function deletePitch(...args: Parameters<typeof admin.deletePitch>) { await assertAdminSession(); return admin.deletePitch(...args); }
export async function publishPitch(...args: Parameters<typeof admin.publishPitch>) { await assertAdminSession(); return admin.publishPitch(...args); }
export async function rerunScreen(...args: Parameters<typeof admin.rerunScreen>) { await assertAdminSession(); return admin.rerunScreen(...args); }
export async function saveCommentary(...args: Parameters<typeof admin.saveCommentary>) { await assertAdminSession(); return admin.saveCommentary(...args); }
export async function deleteCommentary(...args: Parameters<typeof admin.deleteCommentary>) { await assertAdminSession(); return admin.deleteCommentary(...args); }
export async function resolveFlag(...args: Parameters<typeof admin.resolveFlag>) { await assertAdminSession(); return admin.resolveFlag(...args); }
export async function updateSource(...args: Parameters<typeof admin.updateSource>) { await assertAdminSession(); return admin.updateSource(...args); }
export async function updateStory(...args: Parameters<typeof admin.updateStory>) { await assertAdminSession(); return admin.updateStory(...args); }
export async function deleteNewsletterSignup(...args: Parameters<typeof admin.deleteNewsletterSignup>) { await assertAdminSession(); return admin.deleteNewsletterSignup(...args); }
export async function exportNewsletterCsv(...args: Parameters<typeof admin.exportNewsletterCsv>) { await assertAdminSession(); return admin.exportNewsletterCsv(...args); }
export async function triggerIngest(...args: Parameters<typeof admin.triggerIngest>) { await assertAdminSession(); return admin.triggerIngest(...args); }
