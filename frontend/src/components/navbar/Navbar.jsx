import React, { useState } from "react";
import {
  Navbar,
  Typography,
  List,
  Input,
  Button,
  Avatar,
  ListItem,
} from "@material-tailwind/react";
import {
  HomeIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassCircleIcon,
  HeartIcon,
  DocumentIcon
} from "@heroicons/react/24/solid";
import Chat from "../../alt_Chat";
import { Friends } from "../../Friends";
import Home from "../../Home";
import CreatePosts from "../../CreatePosts";
import { Profile } from "../../Profile";
import Logout from "../auth/Logout";


export function NavbarWithSearch() {
  const [page, setPage] = useState(<Home />);

  // Go to a specific page when clicked
  // const goToPage = (component) => {
  //   setPage(component);
  // };


  const pages = [
    { title: "Home", component: <Home />, icon: HomeIcon, path: "/home" },
    { title: "Add/Remove Friends", component: <Friends />, icon: UserPlusIcon, path: "/friends" },
    { title: "Chat", component: <Chat />, icon: ChatBubbleLeftRightIcon, path: "/chat" },
    { title: "Create Posts", component: <CreatePosts />, icon: DocumentIcon, path: "/create_posts" },
    { title: "Logout", component: <Logout />, icon: HeartIcon, path: "/logout"}
  ];

  return (
    <>
      <div className="mx-auto flex flex-col max-w-screen-xl  overflow-y-auto h-screen">
        <Navbar className="px-6 py-2 sticky top-0 z-50">
          <div className="container mx-auto flex flex-wrap items-center justify-between text-blue-gray-900">
            <Typography className="mr-4 py-1.5 font-large">
              Pennstagram
            </Typography>
            <List className="flex-row">
              {pages.map(({ title, component, icon }, key) => (
                <Typography
                  as="a"
                  key={key}
                  color="blue-gray"
                  className="flex items-center gap-x-2 p-3 font-medium"
                  onClick={() => setPage(component)}
                >
                  <ListItem className="flex items-center gap-2 py-2 pr-4">
                    {React.createElement(icon, { className: "w-5 h-5" })}{" "}
                    {title}
                  </ListItem>
                </Typography>
              ))}
            </List>
            <div className="hidden items-center gap-x-2 lg:flex">
              <div className="relative flex w-full gap-2 md:w-max">
                <Input
                  type="search"
                  placeholder="Query"
                  containerProps={{
                    className: "min-w-[288px]",
                  }}
                  className=" !border-t-blue-gray-500 pl-9 placeholder:text-blue-gray-500 focus:!border-blue-gray-500"
                  labelProps={{
                    className: "before:content-none after:content-none",
                  }}
                />
                <div className="!absolute left-2 top-[10.5px]">
                  <MagnifyingGlassCircleIcon className="w-5 h-5 text-blue-gray-300" />
                </div>
              </div>
              <Button size="md" className="rounded-lg ">
                Search
              </Button>
            </div>
            <Button
              variant="text"
              color="blue-gray"
              className="flex items-center rounded-full py-0.5 px-0.5"
              onClick={() => setPage(<Profile />)}
            >
              <Avatar
                variant="circular"
                size="sm"
                className="border border-gray-900 p-0.5"
                src="https://docs.material-tailwind.com/img/face-2.jpg"
              />
            </Button>
          </div>
        </Navbar>
        <div className="pt-10">{page}</div>
      </div>
    </>
  );
}

export default NavbarWithSearch;