import { NextPageContext } from "next";

import { getNavbarLayout } from "../../../src/components/layouts/NavbarLayout/NavbarLayout";
import SpaceLayout from "../../../src/components/layouts/SpaceLayout/SpaceLayout";
import {
  PublicationProps,
  getPublicationProps,
} from "../../../src/helpers/lens/getPublicationProps";

export async function getServerSideProps({ res, query }: NextPageContext) {
  res?.setHeader("Cache-Control", "s-maxage=120");

  const props = await getPublicationProps(query.id as string);

  return {
    props,
  };
}

export default function Space(props: PublicationProps) {
  return (
    <SpaceLayout {...props}>
      <div className="space-y-2">
        <div className="text-2xl font-bold">Description</div>
        <div className="text-lg text-outline">
          {props.publication?.metadata.description}
        </div>
      </div>
    </SpaceLayout>
  );
}

Space.getLayout = getNavbarLayout;
