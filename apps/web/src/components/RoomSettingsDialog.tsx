import { Dispatch, SetStateAction, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useQueryClient } from "react-query";
import {
  editRoom,
  removeRoomFromProfile,
  unpinTile,
  useIpfsFile,
  useRoom,
} from "ceramic";

import { Button, Dialog, ImageUpload, TextField } from "./base";

interface Props {
  id: string;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export function RoomSettingsDialog({ id, open, setOpen }: Props) {
  const router = useRouter();

  const name = useRef<HTMLInputElement>();
  const description = useRef<HTMLInputElement>();

  const [imageFile, setImageFile] = useState<File>();
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingsDelete, setLoadingsDelete] = useState(false);

  const queryClient = useQueryClient();
  const { room } = useRoom(id);
  const image = useIpfsFile(room?.image);

  async function handleSave() {
    if (loadingSave) return;
    setLoadingSave(true);

    await editRoom(
      id,
      name.current.value,
      description.current.value,
      imageFile
    );

    queryClient.invalidateQueries(`room-${id}`);
    setOpen(false);
    setLoadingSave(false);
  }

  async function handleDelete() {
    if (loadingsDelete) return;
    setLoadingsDelete(true);

    await unpinTile(id);
    await removeRoomFromProfile(id);

    router.push("/");
  }

  return (
    <Dialog open={open} setOpen={setOpen}>
      <div className="space-y-6">
        <h1 className="text-3xl flex justify-center">Settings</h1>

        <div className="h-32">
          <ImageUpload setImageFile={setImageFile} defaultValue={image} />
        </div>

        <div className="space-y-4">
          <TextField title="Name" inputRef={name} defaultValue={room?.name} />
          <TextField
            title="Description"
            inputRef={description}
            defaultValue={room?.description}
          />
        </div>

        <div className="space-y-2">
          <Button loading={loadingSave} onClick={handleSave}>
            Save
          </Button>
          <Button loading={loadingsDelete} color="red" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
