import React, { useState } from "react"
import {
  Navbar,
  Typography,
  List,
  Input,
  Button,
  Avatar,
  ListItem,
} from "@material-tailwind/react"
import {
  HomeIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassCircleIcon,
  HeartIcon,
  DocumentIcon
} from "@heroicons/react/24/solid"
import Chat from "../../alt_Chat"
import { Friends } from "../../Friends"
import Home from "../../Home"
import CreatePosts from "../../CreatePosts"
import { Profile } from "../../Profile"
import Search from "../../Search"
import Logout from "../auth/Logout"
import ChangeTag from "../../ChangeTag";




export function NavbarWithSearch() {
  const [page, setPage] = useState(<Home />);

  // Go to a specific page when clicked
  // const goToPage = (component) => {
  //   setPage(component);
  // };

   
  const pages = [
    { title: "Home", component: <Home />, icon: HomeIcon, path: "/home" },
    { title: "Friends", component: <Friends />, icon: UserPlusIcon, path: "/friends" },
    { title: "Chat", component: <Chat />, icon: ChatBubbleLeftRightIcon, path: "/chat" },
    { title: "Create Posts", component: <CreatePosts />, icon: DocumentIcon, path: "/create_posts" },
    { title: "Profile", component: <Profile />, icon: HeartIcon, path: "/change_tags" },
    { title: "Search", component: <Search />, icon: HeartIcon, path: "/search" },
    { title: "Logout", component: <Logout />, icon: HeartIcon, path: "/logout" }
  ];

  return (
    <>
      <div className="flex h-screen w-screen bg-gray-200">
        <div className="flex flex-col bg-white">
          <Typography className="mr-4 py-1.5 font-large text-black">
            Pennstagram
          </Typography>
          <List className="flex-1 mt-4">
            {pages.map(({ title, component, icon }, key) => (
              <Typography
                as="a"
                key={key}
                color="blue-gray"
                className="flex items-center gap-y-6 p-3 rounded-lg font-medium cursor-pointer hover:bg-blue-gray-100"
                onClick={() => setPage(component)}
              >
                {React.createElement(icon, { className: "w-5 h-5 mr-2" })} {title}
              </Typography>
            ))}
          </List>
        </div>
        <div className="flex flex-col w-full">
          <div className="">{page}</div>
        </div>
      </div>
    </>
  );
}

export default NavbarWithSearch