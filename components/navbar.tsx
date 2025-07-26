"use client";

import * as React from "react";
import { UserProfile, UserButton } from "@clerk/nextjs";

const Navbar: React.FC = () => {
    return (
        <nav className="px-8 py-2 flex justify-between items-center border-b-2 shadow-xl mt-2">
            <div>
                <h3 className="text-2xl font-bold">AWS-S3</h3>
            </div>
            <div className="">
                <UserButton
                    appearance={{
                        elements: {
                            userButtonAvatarBox: {
                               width:"48px",
                               height:"48px",
                            },
                        },
                    }}
                />
            </div>

        </nav>
    );
}

export default Navbar;
