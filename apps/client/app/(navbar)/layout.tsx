import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import Logo from "../../public/images/Logo.png";
import Avatar from "../../src/home/Avatar";
import { getServerSession } from "../../src/server/helpers/getServerSession";
import NavigationTab from "../../src/ui/NavigationTab";
import ProfileButton from "./ProfileButton";
import SignInButton from "./SignInButton";

export default async function NavbarLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  return (
    <>
      <div className="absolute z-20 h-14 w-full">
        <nav
          className="flex h-full w-full justify-center bg-white"
          style={{ paddingLeft: "calc(100vw - 100%)" }}
        >
          <div className="max-w-content mx-4 flex justify-between md:grid md:grid-cols-3">
            <div className="flex items-center">
              <Link
                href="/"
                className="relative aspect-square h-9 cursor-pointer rounded-full outline-neutral-400"
              >
                <Image src={Logo} alt="logo" priority width={36} height={36} />
              </Link>
            </div>

            <div className="flex items-center justify-center space-x-1 md:space-x-4">
              <div>
                <NavigationTab text="Explore" href="/explore" />
              </div>
              <div className="hidden md:block">
                <NavigationTab text="Create" href="/create" />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Suspense fallback={<Avatar loading circle size={36} />}>
                {/* @ts-expect-error Server Component */}
                {session ? <ProfileButton session={session} /> : <SignInButton />}
              </Suspense>
            </div>
          </div>
        </nav>
      </div>

      <div className="h-screen pt-14">{children}</div>
    </>
  );
}
