import React, { useState } from 'react';
import axios from 'axios';


export function Search() {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState('');

    const handleSearch = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/posts/getSearch/${ query }`);
            setResult(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setResult('Failed to fetch data.');
        }
    };

    console.log(result)
    return (
        <div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your query"
            />
            <button onClick={handleSearch}>Search</button>
            <div>
                <p>Results:</p>
                {result && <div>{JSON.stringify(result)}</div>}
            </div>
        </div>
    );
};

export default Search;
