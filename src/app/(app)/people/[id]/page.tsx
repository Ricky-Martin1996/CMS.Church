import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMemberProfileAction } from "@/application/people/actions";
import {
  MemberProfileView,
  type SerializedProfile,
} from "@/components/people/member-profile-view";

export const metadata: Metadata = {
  title: "Member Profile",
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
};

export default async function MemberProfilePage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const result = await getMemberProfileAction(id);

  if (!result.ok) {
    notFound();
  }

  const profile = JSON.parse(
    JSON.stringify(result.data)
  ) as SerializedProfile;

  return (
    <MemberProfileView
      profile={profile}
      justCreated={query.created === "1"}
    />
  );
}
