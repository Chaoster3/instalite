import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "./utils/constants";

const HashTagsSelector = ({ handleSubmit, doneButtonText, finalHashtagNames, setFinalHashtagNames}) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // const [finalHashtagNames, setFinalHashtagNames] = useState([]);

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
        setFinalHashtagNames([...finalHashtagNames, response.data.name]);
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


  const addSearchedTagToFinal = (tag) => {
    // Check if the tag is already in the finalTags array
    const isTagInFinalTags = finalHashtagNames.some(finalTag => finalTag.name === tag.name);

    if (!isTagInFinalTags) {
      setFinalHashtagNames([...finalHashtagNames, tag.name]);
    }
  };

  // Function to remove a final tag from the finalTags array
  const removeFinalTag = (tagName) => {
    const newHashtagNames = finalHashtagNames.filter(tag => tag !== tagName);
    setFinalHashtagNames(newHashtagNames);
  };


  return (
    <>
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

      <div>
        <h2>Final Tags</h2>
        {finalHashtagNames.map((tagName) => (
          <button
            key={tagName}
            onClick={() => removeFinalTag(tagName)}
          >
            {tagName}
          </button>
        ))}
      </div>
      <button onClick={handleSubmit}>{doneButtonText}</button>
    </>
  )
}


export default HashTagsSelector