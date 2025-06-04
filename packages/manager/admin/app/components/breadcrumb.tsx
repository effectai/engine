import { useLocation } from "@remix-run/react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from "./ui/breadcrumb";

export function DynamicBreadcrumbs() {
  const location = useLocation();
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>{location.pathname}</BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
