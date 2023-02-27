import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchProject } from "../../../../src/server/helpers/fetchProject";
import { fetchProjectImage } from "../../../../src/server/helpers/fetchProjectImage";
import NavigationTab from "../../../../src/ui/NavigationTab";
import { isFromCDN } from "../../../../src/utils/isFromCDN";

export const metadata = {
  title: "Project",
};

interface Props {
  children: React.ReactNode;
  params: { id: string };
}

export default async function Project({ children, params: { id } }: Props) {
  const [project, image] = await Promise.all([fetchProject(id), fetchProjectImage(id)]).catch(
    notFound
  );

  return (
    <div className="flex justify-center">
      <div className="max-w-content mx-4 space-y-8 py-8">
        <div className="flex flex-col space-y-8 md:flex-row md:space-y-0 md:space-x-8">
          <div className="aspect-card h-full w-full rounded-2xl bg-neutral-200">
            <div className="relative h-full w-full object-cover">
              {image &&
                (isFromCDN(image) ? (
                  <Image
                    src={image}
                    priority
                    fill
                    sizes="40vw"
                    alt=""
                    className="rounded-2xl object-cover"
                  />
                ) : (
                  <img
                    src={image}
                    alt=""
                    className="h-full w-full rounded-2xl object-cover"
                    crossOrigin="anonymous"
                  />
                ))}
            </div>
          </div>

          <div className="flex flex-col justify-between space-y-8 md:w-2/3">
            <div className="space-y-4">
              <div className="flex justify-center text-3xl font-black">{project?.name}</div>
            </div>

            <Link
              href={`/editor/${id}`}
              className="rounded-full bg-neutral-900 py-3 text-center text-lg font-bold text-white transition hover:scale-105 active:opacity-90"
            >
              Open Editor
            </Link>
          </div>
        </div>

        <div className="flex space-x-4">
          <NavigationTab
            text="About"
            href={`/create/${id}`}
            exact
            className="w-full rounded-lg text-lg"
          />
          <NavigationTab
            text="Settings"
            href={`/create/${id}/settings`}
            exact
            className="w-full rounded-lg text-lg"
          />
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
