import { router } from "expo-router";

export const goBackOrReplace = (fallbackHref: string) => {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallbackHref as never);
};
