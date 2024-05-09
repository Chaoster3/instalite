import React, { useEffect, useState } from "react";
import { Avatar, Card, Button } from "@material-tailwind/react";
import axios from "axios";
import { BACKEND_URL } from "./utils/constants";
import { useNavigate } from "react-router-dom";


export function Profile() {
  const navigate = useNavigate();


  const [currentUser, setCurrentUser] = useState({});
  const [currentUserInterestNames, SetCurrentUserInterestNames] = useState([]);



  // Get the current user's username
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/users/getCurrentUser`)

        if (response.status === 200) {
          console.log(response.data.response[0])
          setCurrentUser(response.data.response[0]);

          const currentUserInterestIds = response.data.response[0].interests;

          // Change the interest ids into hashtag names
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
    <div className="flex flex-col">
      {/* Card for the current user */}
      <Card className="flex-auto flex flex-row mt-6">
        <div className="flex flex-col items-center justify-center w-full">
          <div className="flex items-center justify-center flex-col">
            <Avatar
              variant="circular"
              className="border border-gray-900 p-0.5 h-52 w-52 left m-5"
              src="https://docs.material-tailwind.com/img/face-2.jpg"
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
