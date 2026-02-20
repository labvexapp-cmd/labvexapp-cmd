"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

const STORAGE_KEY = "age_verified";

export function AgeVerification() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem(STORAGE_KEY);
    if (!verified) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const handleConfirm = (remember: boolean) => {
    if (remember) {
      localStorage.setItem(STORAGE_KEY, "true");
    } else {
      sessionStorage.setItem(STORAGE_KEY, "true");
    }
    setShow(false);
  };

  const handleDeny = () => {
    window.location.href = "https://google.com";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>

        <h2 className="mb-2 text-xl font-bold text-foreground">
          Yaş Doğrulama
        </h2>

        <p className="mb-6 text-sm text-muted-foreground">
          Bu web sitesi yetişkinlere yönelik içerik barındırmaktadır.
          Devam ederek 18 yaşından büyük olduğunuzu onaylıyorsunuz.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full text-base font-semibold"
            onClick={() => handleConfirm(false)}
          >
            18 Yaşından Büyüğüm - Devam Et
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => handleConfirm(true)}
          >
            Bir daha sorma
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={handleDeny}
          >
            18 yaşından küçüğüm - Çıkış
          </Button>
        </div>

        <p className="mt-4 text-[10px] text-muted-foreground">
          Bu siteye girerek{" "}
          <a href="/yasal/kullanim-sartlari" className="underline">
            Kullanım Şartları
          </a>
          &apos;nı kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  );
}
