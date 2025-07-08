import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

export default function NavbarOnlyLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar maxWidthClass="" />
      <main className="flex-1 min-h-0 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
