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
          const tagNames = response.data.map(tag => tag.name);
          setTopTenTagsNames(response.data);
          // console.log('Top ten tags:', topTenTagsNames)
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
    <div>
      <h2>Tag Suggestions</h2>
      <div>
        {topTenTagsNames.map((tag) => (
          <button key={tag.id} onClick={() => addSearchedTagToFinal(tag)}>
            {tag.name}
          </button>
        ))}
      </div>

      <br></br>
      <hr/>
      <br></br>

      <h2>Choose New Tags</h2>
      <div>
        <input
          type="text"
          placeholder="Search for tags"
          value={searchInput}
          onChange={handleSearchInputChange}
        />
        <button onClick={searchTags}>Search</button>
      </div>

      {isLoading && <div>Loading...</div>}
      {errorMessage && <div>{errorMessage}</div>}

      <div>
        {searchResults && searchResults.map((tag) => (
          <button key={tag.id} onClick={() => addSearchedTagToFinal(tag)}>
            {tag.name}
          </button>
        ))}
      </div>

      <div>
        <input
          type="text"
          placeholder="Enter new tag"
          value={newTagInput}
          onChange={handleNewTagInputChange}
        />
        <button onClick={createTag}>Create</button>
      </div>

      {/* Render finalTags */}
      <br></br>
      <hr />
      <br></br>
      <div>
        <h2>Final Tags</h2>
        {finalTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => removeFinalTag(tag.name)}
          >
            {tag.name}
          </button>
        ))}
      </div>


      {/* Update hashtags */}
      <button onClick={updateUserHashTags}>Update Hashtags</button>

    </div>
  );
};

export default ChangeTag;
