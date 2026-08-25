"use client";

import { motion } from "framer-motion";

export function ScrollIndicator() {
  return (
    <motion.div
      className="absolute -bottom-24 left-1/2 -translate-x-1/2"
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="flex h-12 w-7 items-start justify-center rounded-full border border-white/30 p-2">
        <div className="h-2 w-1 rounded-full bg-white/60" />
      </div>
    </motion.div>
  );
}
