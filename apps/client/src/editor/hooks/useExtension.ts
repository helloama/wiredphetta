import { ExtensibleProperty, ExtensionProperty } from "@gltf-transform/core";
import {
  Avatar,
  AvatarExtension,
  Collider,
  ColliderExtension,
  SpawnPoint,
  SpawnPointExtension,
} from "@wired-labs/gltf-extensions";
import { useEffect, useState } from "react";

export function useExtension<T extends ExtensionProperty>(
  property: ExtensibleProperty | null,
  extensionName: string
) {
  const [extension, setExtension] = useState<T | null>(null);

  useEffect(() => {
    if (!property) {
      setExtension(null);
      return;
    }

    const extension = property.getExtension<T>(extensionName);
    setExtension(extension);
  }, [property, extensionName]);

  return extension;
}

export function useAvatar(property: ExtensibleProperty | null) {
  return useExtension<Avatar>(property, AvatarExtension.EXTENSION_NAME);
}

export function useCollider(property: ExtensibleProperty | null) {
  return useExtension<Collider>(property, ColliderExtension.EXTENSION_NAME);
}

export function useSpawnPoint(property: ExtensibleProperty | null) {
  return useExtension<SpawnPoint>(property, SpawnPointExtension.EXTENSION_NAME);
}
