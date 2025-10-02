import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";


export const metadata: Metadata = {
title: "Ana Huang — Queue Display",
description: "Sistem antrian & display acara book signing Ana Huang (dipersembahkan oleh Periplus)",
themeColor: "#111",
openGraph: {
title: "Ana Huang — Queue Display",
description: "Sistem antrian & display acara book signing Ana Huang",
images: ["/ana/ana-hero.jpg"],
},
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html lang="id">
<body>
<ToastProvider>{children}</ToastProvider>
</body>
</html>
);
}