import React, { useEffect, useState } from "react";
import { Avatar, Card, Button } from "@material-tailwind/react";
import axios from "axios";
import { BACKEND_URL } from "./utils/constants";
import { useNavigate } from "react-router-dom";


export function Profile() {
  const navigate = useNavigate();


  const [currentUser, setCurrentUser] = useState({});
  const [currentUserInterestNames, SetCurrentUserInterestNames] = useState([]);
  const [actor, setActor] = useState({
    "linked_nconst": "",
    "primaryName": "",
  });
  const [actorImageURL, setActorImageURL] = useState('');

  // Get the current user
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/users/getCurrentUser`)

        if (response.status === 200) {
          console.log(response.data.response[0])
          setCurrentUser(response.data.response[0]);

          // Change the interest ids into hashtag names
          const currentUserInterestIds = response.data.response[0].interests;
          const interestNames = []
          const interestsArray = JSON.parse(currentUserInterestIds);
          for (const id of interestsArray) {
            const response = await axios.get(`${BACKEND_URL}/tags/getTagNameFromID/${id}`)
            interestNames.push(response.data.name)
          }

          SetCurrentUserInterestNames(interestNames)
        } else {
          console.error("Error fetching username");
          setCurrentUser({});
          SetCurrentUserInterestNames([])
        }
      } catch (error) {
        console.error("Error fetching username:", error);
        setCurrentUser({});
        SetCurrentUserInterestNames([])
      }
    }

    fetchUsername();
  }, [])

  // Get the actor associated with the current user
  useEffect(() => {
    const fetchActor = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/users/getActor`)
        if (response.status === 200) {
          setActor({
            "linked_nconst": response.data.actor[0].nconst,
            "primaryName": response.data.actor[0].primaryName,
          });
        } else {
          console.error("Error fetching actor");
          setActor({
            "linked_nconst": "",
            "primaryName": "",
          });
        }
      } catch (error) {
        console.error("Error fetching actor:", error);
        setActor({
          "linked_nconst": "",
          "primaryName": "",
        });
      }
    }

    fetchActor();
  }, [])

  const handleChangeEmail = async () => {
    navigate("/changeEmail")
  }

  const handleChangePassword = async () => {
    navigate("/changePassword")
  }

  const handleInterests = async () => {
    navigate("/changeTag")
  }


  return (
    <div className="flex flex-col h-screen overflow-y-auto">
      {/* Card for the current user */}
      <div style={{ paddingTop: '20px' }}>
        <h1>User</h1>
      </div>
      <Card className="flex-auto flex flex-row mt-6">
        <div className="flex flex-col items-center justify-center w-full">
          <div className="flex items-center justify-center flex-col">
            <Avatar
              variant="circular"
              className="border border-gray-900 p-0.5 h-52 w-52 left m-5"
              src={currentUser.image_link}
            />

            <div className="flex flex-row justify-end">
              <Button variant="contained" onClick={handleChangeEmail} className="mb-5 mr-5">
                Change Email
              </Button>
              <Button variant="contained" onClick={handleChangePassword} className="mb-5 mr-5">
                Change Password
              </Button>
              <Button variant="contained" onClick={handleInterests} className="mb-5">
                Change Interests
              </Button>
            </div>
            <div className="text-2xl"> <strong>Username:</strong>{currentUser.username}</div>
            <div className="text-2xl"> <strong>Email:</strong> {currentUser.email}</div>
            <div className="text-2xl"> <strong>Birthday:</strong> {currentUser.birthday}</div>

            {/* Show the interests */}
            <div className="text-2xl"> <strong>Interests:</strong> {currentUserInterestNames.join(", ")}</div>
          </div>
        </div>
      </Card>



      {/* Card for the matched person */}
      <div style={{ paddingTop: '20px' }}>
        <h1>Associated Actor</h1>
      </div>
      <Card className="flex-auto flex flex-row mt-6">
        <div className="flex flex-col items-center justify-center w-full">
          <div className="flex items-center justify-center flex-col">
            <Avatar
              variant="circular"
              className="border border-gray-900 p-0.5 h-52 w-52 left m-5"
              src={`${BACKEND_URL}/images/${actor.linked_nconst}.jpg`}
            />

            <div className="text-2xl"> <strong>Name:</strong>{actor.primaryName}</div>
            <div className="text-2xl"> <strong>Linked_Nconst:</strong> {actor.linked_nconst}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Profile;
