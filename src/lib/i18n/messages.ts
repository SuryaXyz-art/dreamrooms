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
      emptyRoomsTitle: "No public rooms yet",
      emptyRoomsBody:
        "Be the first host: choose a live market, add your thesis and share the room.",
    },
    project: {
      eyebrow: "About DreamRooms",
      title: "A social layer for live Event Contracts.",
      body: "DreamRooms keeps protocol truth on DreamDEX and gives people a focused place to compare conviction, act with a wallet and verify what happened.",
      steps: [
        {
          title: "Discover",
          body: "Live BTC and ETH windows are discovered from the Shannon read path.",
        },
        {
          title: "Gather",
          body: "A host shares one market context; visitors can read before connecting a wallet.",
        },
        {
          title: "Verify",
          body: "Trades enter activity only after receipt, market and position checks agree.",
        },
      ],
      faq: [
        {
          question: "Is this mainnet?",
          answer:
            "No. The wallet flow is explicitly limited to Somnia Shannon testnet (chain 50312).",
        },
        {
          question: "Is sentiment a trade?",
          answer:
            "No. Signed room sentiment is social context and is kept separate from wallet-signed DreamDEX orders.",
        },
        {
          question: "What can I lose?",
          answer:
            "A binary position can lose the amount staked. Review the live quote and approve every transaction yourself.",
        },
      ],
      testnet: "Shannon testnet · self-custody · manual signatures",
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
      emptyRoomsTitle: "अभी कोई सार्वजनिक रूम नहीं",
      emptyRoomsBody: "पहले होस्ट बनें: लाइव मार्केट चुनें, अपना विचार जोड़ें और रूम साझा करें।",
    },
    project: {
      eyebrow: "DreamRooms के बारे में",
      title: "लाइव Event Contracts के लिए एक सोशल लेयर।",
      body: "DreamRooms प्रोटोकॉल की सच्चाई DreamDEX पर रखता है और लोगों को भरोसा तुलना करने, वॉलेट से कार्रवाई करने और परिणाम सत्यापित करने की जगह देता है।",
      steps: [
        { title: "खोजें", body: "लाइव BTC और ETH विंडो Shannon रीड पाथ से खोजी जाती हैं।" },
        {
          title: "जुड़ें",
          body: "होस्ट एक मार्केट संदर्भ साझा करता है; विज़िटर वॉलेट जोड़े बिना पढ़ सकते हैं।",
        },
        {
          title: "सत्यापित करें",
          body: "रसीद, मार्केट और पोज़िशन जांच मिलने के बाद ही ट्रेड गतिविधि में आता है।",
        },
      ],
      faq: [
        {
          question: "क्या यह मेननेट है?",
          answer: "नहीं। वॉलेट फ्लो केवल Somnia Shannon टेस्टनेट (चेन 50312) तक सीमित है।",
        },
        {
          question: "क्या sentiment एक ट्रेड है?",
          answer:
            "नहीं। साइन किया हुआ रूम sentiment सामाजिक संदर्भ है और DreamDEX ऑर्डर से अलग रखा जाता है।",
        },
        {
          question: "मैं कितना खो सकता हूँ?",
          answer:
            "बाइनरी पोज़िशन में लगाई गई राशि तक नुकसान हो सकता है। लाइव कोट देखें और हर ट्रांज़ैक्शन को स्वयं मंज़ूर करें।",
        },
      ],
      testnet: "Shannon टेस्टनेट · स्व-कस्टडी · मैनुअल सिग्नेचर",
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
