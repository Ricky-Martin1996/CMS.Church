import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHouseholdProfileAction } from "@/application/households/actions";
import {
  HouseholdProfileView,
  type SerializedHouseholdProfile,
} from "@/components/households/household-profile-view";

export const metadata: Metadata = {
  title: "Household Profile",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function HouseholdProfilePage({ params }: PageProps) {
  const { id } = await params;
  const result = await getHouseholdProfileAction(id);

  if (!result.ok) {
    notFound();
  }

  const profile = JSON.parse(
    JSON.stringify(result.data)
  ) as SerializedHouseholdProfile;

  return <HouseholdProfileView profile={profile} />;
}
