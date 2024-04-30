import { useEffect, useState } from "react";
import axios from 'axios';


export function Friends() {
    const [friends, setFriends] = useState([]);


    // Ge tthe list of friends from the backend
    const getFriends = async () => {
        try {
            const response = await axios.get('http://localhost:3000/users/getAllFriends');
            console.log(response.data);
            console.log(response.friends)
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    }

    useEffect(() => {
        getFriends();
    }, []);

    return (
        <div>
            <h1>Friends</h1>
        </div>
    )
}

export default Friends;