import React, { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "./utils/constants";
import { useNavigate } from 'react-router-dom';
import { Avatar, Card, Button } from "@material-tailwind/react";




const ChangeActor = () => {
    const navigate = useNavigate();
    const [fiveMostSimilarActors, setFiveMostSimilarActors] = useState([]);

    useEffect(() => {
        const fetchFiveMostSimilarActors = async () => {
            try {
                const response = await axios.get(`${BACKEND_URL}/users/get5ClosestActors`);


                if (response.status === 200) {
                    setFiveMostSimilarActors(response.data.returnedActorObjects);
                } else {
                    console.error("Error fetching five most similar actors");
                }
            } catch (error) {
                console.error("Error fetching five most similar actors:", error);
            }
        }

        fetchFiveMostSimilarActors();
    }, [])

    const handleChangeActor = async (actorId) => {
        try {
            const response = await axios.put(`${BACKEND_URL}/users/changeActor`, {
                "linked_nconst": actorId
            });
            
            // Create an automatic post of the status update
            const getCurrentResponse = await axios.get(`${BACKEND_URL}/users/getCurrentUser`)
            const currentUsername = getCurrentResponse.data.response[0].username;
            const newLinkedName = fiveMostSimilarActors.find(actor => actor.nconst === actorId).primaryName;
            // const postMessage = `${currentUsername} is now linked to ${newLinkedName}`;

            // Create a post response
            // const postResponse = await axios.post(`${BACKEND_URL}/posts/createPost`, {
            //   "content": postMessage,
            // });

            if (response.status === 200) {
                console.log("Successfully changed actor");
                navigate("/")
            } else {
                console.error("Error changing actor");
            }
        } catch (error) {
            console.error("Error changing actor:", error);
        }
    }

    return (
        // Display the actors
        <div>
            <h1>Change Actor</h1>
            <h2>Choose an actor to represent you</h2>
            <div className="actors-list-container overflow-y-auto flex flex-col items-center max-h-[800px]">
                {fiveMostSimilarActors.map((actor, index) => (
                    <div key={index} className="actor-container border border-gray-900 p-2 flex flex-col items-center mb-4">
                        <h3 className="text-xl font-bold mb-2">{actor.primaryName}</h3>
                        <Avatar
                            variant="circular"
                            className="border border-gray-900 p-0.5 h-52 w-52 m-2"
                            src={`${BACKEND_URL}/images/${actor.nconst}.jpg`}
                        />
                        <button onClick={() => handleChangeActor(actor.nconst)} className="bg-blue-500 text-white px-4 py-2 rounded-lg">
                            Change actor
                        </button>
                    </div>
                ))}
            </div>

        </div>
    )
}

export default ChangeActor