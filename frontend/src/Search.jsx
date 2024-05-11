import React, { useState } from 'react';
import axios from 'axios';
import Post from './Post.jsx';

export function Search() {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState(null);
    const [text, setText] = useState('');

    const handleSearch = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/posts/getSearch/${ query }`);
            console.log(response);
            console.log(response.data.response[1]);
            const responses = response.data.response[0].map(doc => axios.get(`http://localhost:3000/posts/getPost/${doc.metadata.post_id}`))
            const x = await Promise.all(responses);
            const y = x.map(res => res.data);
            setText(response.data.response[1]);
            setResult(y);
        } catch (error) {
            console.error('Error fetching data:', error);
            setResult('Failed to fetch data.');
        }
    };

    console.log(text);

    return (
        <div class="p-4 flex flex-col h-full items-center">
            <input
                class="w-64 px-4 py-2 mb-4 border border-gray-300 rounded"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your query"
            />
            <button
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
                onClick={handleSearch}
            >
                Search
            </button>
            <div class="mt-8 h-full overflow-y-auto">
                <p class="text-lg font-bold mb-4">Results:</p>
                {text}
                {result && result.map((item) => (
                    <Post key={item.post_id} post={item}></Post>
                ))}
            </div>
        </div>

    );
};

export default Search;
