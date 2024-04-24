import React, { useEffect, useState } from "react";
import { Avatar, Card } from "@material-tailwind/react";

export function Profile() {
  const [hashtags, setHashtags] = useState([]);
  const [recHashtags, setRecHashtags] = useState([]); // Recommended hashtags
  useEffect(() => {
    // fetch("/api/hashtags")
    //   .then((res) => res.json())
    //   .then((data) => {
    //     setHashtags(data);
    //   });
    setHashtags(["#hashtag1", "#hashtag2", "#hashtag3"]);
    setRecHashtags(["#hashtag4", "#hashtag5", "#hashtag6"]);
  });
  return (
    <div className="flex flex-col">
      <div className="text-left p-5 text-2xl font-bold mb-4">Profile</div>
      <Card className="flex-auto flex flex-row mt-6">
        <div className="flex flex-col">
          <Avatar
            variant="circular"
            className="border border-gray-900 p-0.5 h-52 w-52 left m-5"
            src="https://docs.material-tailwind.com/img/face-2.jpg"
          />
          <div className="text-2xl mb-5"> First Name Last Name</div>
        </div>
        <div className="grow flex flex-col w-max justify-evenly">
          <div className="flex-auto text-right text-4xl mr-5">Username</div>
          <div className="flex-auto text-right text-4xl mr-5">Affiliation </div>
          <div className="flex-auto text-right text-4xl mr-5">Email </div>
          <div className="flex-auto text-right text-4xl mr-5">Birthday </div>
        </div>
      </Card>
      <Card className="flex-auto flex flex-row mt-6">
        <div className="flex flex-col">
          <Avatar
            variant="circular"
            className="border border-gray-900 p-0.5 h-52 w-52 left m-5"
            src="https://docs.material-tailwind.com/img/face-3.jpg"
          />
          <div className="text-2xl mb-5"> Actor Name</div>
        </div>
        <div className="grow flex flex-col w-max justify-evenly">
          <div className="flex-auto text-right text-4xl mr-5">Hashtags</div>
        </div>
      </Card>
    </div>
  );
}

export default Profile;
