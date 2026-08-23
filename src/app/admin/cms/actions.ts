"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");
  return user;
}

// --- CMS pages ---
export async function savePage(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const data = {
    title,
    slug: String(formData.get("slug") ?? "").trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    content: String(formData.get("content") ?? ""),
    seoTitle: String(formData.get("seoTitle") ?? "").trim() || null,
    seoDescription: String(formData.get("seoDescription") ?? "").trim() || null,
    status: String(formData.get("status") ?? "PUBLISHED"),
  };
  if (!title) return;
  if (id) {
    await prisma.cmsPage.update({ where: { id }, data });
  } else {
    await prisma.cmsPage.create({ data });
  }
  await audit({ actor: admin, action: id ? "cms.page_updated" : "cms.page_created", entityType: "cms_page", entityId: id || data.slug });
  revalidatePath("/admin/cms");
}

// --- Banners ---
export async function saveBanner(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  if (!title || !imageUrl) return;
  const data = {
    title,
    subtitle: String(formData.get("subtitle") ?? "").trim() || null,
    imageUrl,
    linkUrl: String(formData.get("linkUrl") ?? "").trim() || null,
    ctaLabel: String(formData.get("ctaLabel") ?? "").trim() || null,
    sortOrder: parseInt(String(formData.get("sortOrder")), 10) || 0,
    status: String(formData.get("status") ?? "ACTIVE"),
  };
  if (id) await prisma.cmsBanner.update({ where: { id }, data });
  else await prisma.cmsBanner.create({ data });
  await audit({ actor: admin, action: id ? "cms.banner_updated" : "cms.banner_created", entityType: "cms_banner", entityId: id || title });
  revalidatePath("/admin/cms");
  revalidatePath("/");
}

export async function deleteBanner(formData: FormData) {
  await requireAdmin();
  await prisma.cmsBanner.deleteMany({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/cms");
  revalidatePath("/");
}

// --- FAQs ---
export async function saveFaq(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!question || !answer) return;
  const data = {
    question,
    answer,
    sortOrder: parseInt(String(formData.get("sortOrder")), 10) || 0,
    status: String(formData.get("status") ?? "ACTIVE"),
  };
  if (id) await prisma.faq.update({ where: { id }, data });
  else await prisma.faq.create({ data });
  await audit({ actor: admin, action: id ? "cms.faq_updated" : "cms.faq_created", entityType: "faq", entityId: id || question.slice(0, 30) });
  revalidatePath("/admin/cms");
}

export async function deleteFaq(formData: FormData) {
  await requireAdmin();
  await prisma.faq.deleteMany({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/cms");
}

// --- Blog ---
export async function saveBlogPost(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const data = {
    title,
    slug: String(formData.get("slug") ?? "").trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    excerpt: String(formData.get("excerpt") ?? "").trim() || null,
    content: String(formData.get("content") ?? ""),
    featuredImage: String(formData.get("featuredImage") ?? "").trim() || null,
    status: String(formData.get("status") ?? "PUBLISHED"),
  };
  if (id) await prisma.blogPost.update({ where: { id }, data });
  else await prisma.blogPost.create({ data });
  await audit({ actor: admin, action: id ? "cms.blog_updated" : "cms.blog_created", entityType: "blog_post", entityId: id || data.slug });
  revalidatePath("/admin/cms");
}
