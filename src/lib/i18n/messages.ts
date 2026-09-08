export const messages = {
  en: {
    nav: { home: "Discover", portfolio: "Portfolio", status: "System status" },
    actions: {
      connect: "Connect wallet",
      createRoom: "Create a room",
      joinRoom: "Join room",
      viewRoom: "View room",
      browseMarkets: "Browse all markets",
      howItWorks: "How it works",
    },
    common: {
      live: "Live",
      demo: "Demo",
      stale: "Stale",
      unavailable: "Unavailable",
      soon: "Closing soon",
    },
    home: {
      eyebrow: "Social prediction, on-chain",
      title: "Make the room before the market moves.",
      body: "DreamRooms gives every live prediction a place to gather: compare the room's conviction with transparent DreamDEX odds.",
      discover: "Discover rooms",
      how: "How it works",
    },
    portfolio: {
      title: "Your positions",
      body: "A calm view of open positions, settled outcomes and what can be claimed.",
      connect: "Connect a wallet to see your portfolio.",
    },
    status: {
      title: "System status",
      body: "A transparent health screen for the app and its future market connection.",
    },
    room: {
      listen: "Listen to summary",
      stop: "Stop summary",
      expiry: "Time to expiry",
      open: "Trading window countdown",
      closed: "Window closed",
      upProbability: "UP probability",
      downProbability: "DOWN probability",
      risk: "Testnet only. Binary outcome: your maximum loss is the amount you stake. You keep custody of your wallet and approve every transaction.",
    },
  },
  hi: {
    nav: { home: "खोजें", portfolio: "पोर्टफोलियो", status: "सिस्टम स्थिति" },
    actions: {
      connect: "वॉलेट जोड़ें",
      createRoom: "रूम बनाएं",
      joinRoom: "रूम में जुड़ें",
      viewRoom: "रूम देखें",
      browseMarkets: "सभी मार्केट देखें",
      howItWorks: "यह कैसे काम करता है",
    },
    common: {
      live: "लाइव",
      demo: "डेमो",
      stale: "पुराना",
      unavailable: "उपलब्ध नहीं",
      soon: "जल्द बंद होगा",
    },
    home: {
      eyebrow: "सोशल प्रेडिक्शन, ऑन-चेन",
      title: "मार्केट बदलने से पहले रूम बनाएं।",
      body: "DreamRooms हर लाइव प्रेडिक्शन को एक जगह देता है—रूम के भरोसे की तुलना पारदर्शी DreamDEX ऑड्स से करें।",
      discover: "रूम खोजें",
      how: "यह कैसे काम करता है",
    },
    portfolio: {
      title: "आपकी पोज़िशन",
      body: "ओपन पोज़िशन, सेटल हुए नतीजों और क्लेम की एक स्पष्ट झलक।",
      connect: "पोर्टफोलियो देखने के लिए वॉलेट जोड़ें।",
    },
    status: {
      title: "सिस्टम स्थिति",
      body: "ऐप और भविष्य के मार्केट कनेक्शन की पारदर्शी हेल्थ स्क्रीन।",
    },
    room: {
      listen: "सारांश सुनें",
      stop: "सारांश रोकें",
      expiry: "समाप्ति तक समय",
      open: "ट्रेडिंग विंडो उलटी गिनती",
      closed: "विंडो बंद है",
      upProbability: "UP संभावना",
      downProbability: "DOWN संभावना",
      risk: "केवल टेस्टनेट। यह द्विआधारी परिणाम है: आपका अधिकतम नुकसान आपकी लगाई गई राशि है। वॉलेट आपके नियंत्रण में रहता है और हर ट्रांज़ैक्शन आपकी मंज़ूरी से होता है।",
    },
  },
} as const;

export type Locale = keyof typeof messages;
export type Messages = (typeof messages)[Locale];
