"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { RainbowKitCustomConnectButton, FaucetButton } from "~~/components/scaffold-eth";
import { hardhat } from "viem/chains";

export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  // Burger-menu drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(burgerMenuRef, useCallback(() => setIsDrawerOpen(false), []));

  // Typewriter logic
  const fullText = "I'm a creator";
  const typingSpeed = 80; // ms per character
  const pauseDuration = 2000; // Pause before restarting
  const [typedText, setTypedText] = useState("");
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (charIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(fullText.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, typingSpeed);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setTypedText("");
        setCharIndex(0);
      }, pauseDuration);
      return () => clearTimeout(timeout);
    }
  }, [charIndex, fullText, typingSpeed, pauseDuration]);

  return (
    <div
      className="
        sticky top-0
        navbar
        min-h-0
        flex-shrink-0
        justify-between
        z-20
        px-2
        bg-transparent
        backdrop-blur-md
        shadow-md
      "
    >
      {/* Left side: Logo + typewriter text */}
      <div className="navbar-start flex-grow ml-4 flex items-center gap-3">
        {/* Responsive GIF Logo */}
        <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24">
          <Image
            src="/logo-animation-unscreen.gif"
            alt="Logo"
            fill
            style={{
              objectFit: "contain",
              backgroundColor: "transparent",
            }}
          />
        </div>

        {/* Responsive Typewriter text using italic Pacifico font */}
        <div
          className="
            text-sm
            sm:text-lg
            md:text-xl
            lg:text-2xl
            xl:text-3xl
            whitespace-nowrap
            text-black
            font-pacifico
            font-bold
          "
        >
          {typedText}
        </div>
      </div>

      {/* Right side: Connect + Faucet */}
      <div className="navbar-end flex-grow mr-4">
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>

      {/* Mobile Drawer (if you need to add mobile nav links) */}
      <div className="lg:hidden dropdown" ref={burgerMenuRef}>
        <label
          tabIndex={0}
          className={`btn btn-ghost ${
            isDrawerOpen ? "hover:bg-secondary" : "hover:bg-transparent"
          }`}
          onClick={() => setIsDrawerOpen(prev => !prev)}
        >
          <Bars3Icon className="h-5 w-5" />
        </label>
        {isDrawerOpen && (
          <ul
            tabIndex={0}
            className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
            onClick={() => setIsDrawerOpen(false)}
          >
            {/* Add your mobile nav links here if needed */}
            <li className="text-sm px-2">No links yet</li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default Header;