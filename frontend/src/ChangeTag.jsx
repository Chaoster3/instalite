import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from "./utils/constants";

const ChangeTag = () => {
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [finalTags, setFinalTags] = useState([]);
  const [topTenTagsNames, setTopTenTagsNames] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');


  // Function to handle search input change
  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  // Function to handle tag creation input change
  const handleNewTagInputChange = (e) => {
    setNewTagInput(e.target.value);
  };

  const searchTags = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const response = await axios.get(`${BACKEND_URL}/tags/searchHashTags/${searchInput}`);

      if (response.status === 200) {
        setSearchResults(response.data);
      } else {
        setErrorMessage('Error searching tags. Please try again later.');
      }
    } catch (error) {
      console.error('Error searching tags:', error);
      setErrorMessage('Error searching tags. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a new tag
  const createTag = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const response = await axios.post(`${BACKEND_URL}/tags/createTag`, { name: newTagInput });

      if (response.status === 201) {
        setNewTagInput('');
        setFinalTags([...finalTags, response.data]);
      } else if (response.status === 400) {
        setErrorMessage('Tag already exists.');
      } else {
        setErrorMessage('Error creating tag. Please try again later.');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      setErrorMessage('Error creating tag. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserHashTags = async () => {
    try {
      setErrorMessage('');

      const finalTagsNames = finalTags.map((tag) => tag.name);
      const response = await axios.post(`${BACKEND_URL}/tags/updateUserHashTags`, { hashtag_names: finalTagsNames });

      if (response.status === 200) {
        console.log('Successfully updated user hashtags');
        setSuccessMessage('Successfully updated user hashtags');
      } else {
        setErrorMessage('Error updating user hashtags. Please try again later.');
      }
    } catch (error) {
      console.error('Error updating user hashtags:', error);
      setErrorMessage('Error updating user hashtags. Please try again later.');
    }
  }

  const addSearchedTagToFinal = (tag) => {
    // Check if the tag is already in the finalTags array
    const isTagInFinalTags = finalTags.some(finalTag => finalTag.name === tag.name);

    if (!isTagInFinalTags) {
      setFinalTags([...finalTags, { id: tag.id, name: tag.name }]);
    }
  };

  // Function to remove a final tag from the finalTags array
  const removeFinalTag = (tagName) => {
    setFinalTags(finalTags.filter(tag => tag.name !== tagName));
  };

  useEffect(() => {
    const getTagsSuggestions = async () => {
      try {
        setErrorMessage('');

        const response = await axios.get(`${BACKEND_URL}/tags/findTopTenTags`);

        if (response.status === 200) {
          setTopTenTagsNames(response.data);
        } else {
          setErrorMessage('Error getting tags suggestions. Please try again later.');
        }
      } catch (error) {
        console.error('Error getting tags suggestions:', error);
        setErrorMessage('Error getting tags suggestions. Please try again later.');
      }
    };

    getTagsSuggestions();

  }, []);

  return (
    <div className="p-4">
      {successMessage && <p className="text-green-500">{successMessage}</p>}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Tag Suggestions</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {topTenTagsNames.map((tag) => (
            <button
              key={tag.id}
              onClick={() => addSearchedTagToFinal(tag)}
              className="bg-blue-500 text-white px-3 py-1 rounded-md"
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      <hr className="my-4" />

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Choose New Tags</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search for tags"
            value={searchInput}
            onChange={handleSearchInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
          />
          <button onClick={searchTags} className="bg-blue-500 text-white px-4 py-2 rounded-md">Search</button>
        </div>
        {isLoading && <div>Loading...</div>}
        {errorMessage && <div className="text-red-500">{errorMessage}</div>}
        <div className="flex flex-wrap justify-center mt-2 gap-2">
          {searchResults && searchResults.map((tag) => (
            <button
              key={tag.id}
              onClick={() => addSearchedTagToFinal(tag)}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md"
            >
              {tag.name}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 mt-4">
          <input
            type="text"
            placeholder="Enter new tag"
            value={newTagInput}
            onChange={handleNewTagInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
          />
          <button onClick={createTag} className="bg-blue-500 text-white px-4 py-2 rounded-md">Create</button>
        </div>
      </div>

      <hr className="my-4" />

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Final Tags</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {finalTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => removeFinalTag(tag.name)}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md"
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      <button onClick={updateUserHashTags} className="bg-blue-500 text-white px-4 py-2 rounded-md">Update Hashtags</button>
    </div>
  );

};

export default ChangeTag;
