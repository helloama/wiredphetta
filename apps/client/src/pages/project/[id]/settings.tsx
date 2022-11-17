import { useRouter } from "next/router";
import { useState } from "react";

import { trpc } from "../../../client/trpc";
import { env } from "../../../env/client.mjs";
import { getNavbarLayout } from "../../../home/layouts/NavbarLayout/NavbarLayout";
import ProjectLayout from "../../../home/layouts/ProjectLayout/ProjectLayout";
import Button from "../../../ui/Button";

function cdnImageURL(id: string) {
  return `https://${env.NEXT_PUBLIC_CDN_ENDPOINT}/published/${id}/image.jpg`;
}

export default function Project() {
  const router = useRouter();
  const id = router.query.id as string;

  const utils = trpc.useContext();

  const { data: project } = trpc.auth.project.useQuery(
    { id },
    {
      enabled: id !== undefined,
      trpc: {},
    }
  );

  const { data: imageURL } = trpc.auth.projectImage.useQuery(
    { id },
    {
      enabled: id !== undefined && !project?.publicationId,
      trpc: {},
    }
  );

  // If published, use the published image
  const image = project?.publicationId
    ? cdnImageURL(project.publicationId)
    : imageURL;

  const { mutateAsync: deleteProject } = trpc.auth.deleteProject.useMutation();

  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const promises: Promise<any>[] = [];

    try {
      promises.push(deleteProject({ id }));
      promises.push(utils.auth.projects.invalidate());

      await Promise.all(promises);

      router.push("/create");
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <ProjectLayout name={project?.name} image={image}>
      <div className="space-y-4 rounded-2xl bg-errorContainer p-8 text-onErrorContainer">
        <div className="text-2xl font-bold">Danger Zone</div>

        <div className="text-lg">
          Deleting a project is permanent and cannot be undone.
        </div>

        <Button
          variant="filled"
          color="error"
          rounded="large"
          loading={loading}
          onClick={handleDelete}
        >
          Delete Project
        </Button>
      </div>
    </ProjectLayout>
  );
}

Project.getLayout = getNavbarLayout;
