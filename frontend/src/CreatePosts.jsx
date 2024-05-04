import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "./utils/constants";
import { useNavigate } from "react-router-dom";

const CreatePosts = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    // image: "",
    content: "",
    hashtag_names: [],
  });
  const [formStatus, setFormStatus] = useState("");

  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [finalTags, setFinalTags] = useState([]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    // const finalTagsNames = finalTags.map(tag => tag.name);
    // setForm(prevForm => ({
    //   ...prevForm,
    //   hashtags: finalTagsNames
    // }));

    console.log("submitted form", form)
    e.preventDefault();
    try {
      const response = await axios.post(
        `${BACKEND_URL}/posts/createPost`,
        form,
      );
      if (response.status === 201) {
        setFormStatus("Post created successfully");
      } else {
        setFormStatus("Post creation failed");
        setForm({
          content: "",
          hashtags: [],
        });
      }
      navigate('/');

    } catch (error) {
      setFormStatus("Post creation failed");
      console.error("Error creating post:", error);
      setForm({
        content: "",
        hashtags: [],
      });
    }
  };

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
        setForm(prevForm => ({
          ...prevForm,
          hashtag_names: [...prevForm.hashtag_names, response.data.name]
        }));
        // setFinalTags([...finalTags, response.data]);
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
    // const isTagInFinalTags = finalTags.some(finalTag => finalTag.name === tag.name);
    const isTagInForm = form.hashtag_names.includes(tag.name);
    if (!isTagInForm) {
      setForm(prevForm => ({
        ...prevForm,
        hashtag_names: [...prevForm.hashtag_names, tag.name]
      }));
    }

    // if (!isTagInFinalTags) {
    //   setFinalTags([...finalTags, { id: tag.id, name: tag.name }]);
    // }
  };

  // Function to remove a final tag from the finalTags array
  const removeFinalTag = (tagName) => {
    // setFinalTags(finalTags.filter(tag => tag.name !== tagName));
    setForm(prevForm => ({
      ...prevForm,
      hashtag_names: prevForm.hashtag_names.filter(tag => tag !== tagName)
    }));
  };


  const inputFields = [
    { name: "content", placeholder: "Content", type: "text" },
  ];

  return (
    <div className="h-screen w-screen flex justify-center flex-col text-gray-700 w-96 rounded-xl bg-clip-border mx-auto">
      <div className="text-center text-2xl font-bold mb-4">
        Create a Post
      </div>
      <div className="flex flex-col gap-4 p-6">
        {inputFields.map((field, index) => (
          <div key={index} className="relative h-11 w-full min-w-[200px]">
            <input
              type={field.type}
              name={field.name}
              value={form[field.name]}
              onChange={handleChange}
              placeholder={field.placeholder}
              className="h-full w-full px-2 py-1 border border-gray-300 rounded-md"
            />
          </div>
        ))}
        <br></br>
        <hr />
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
          {form.hashtag_names.map((tagName) => (
            <button
              key={tagName}
              onClick={() => removeFinalTag(tagName)}
            >
              {tagName}
            </button>
          ))}
        </div>
        {formStatus && <p className={formStatus.includes('successful') ? 'text-green-500' : 'text-red-500'}>{formStatus}</p>}
        <button className="bg-blue-500 text-white py-2 rounded-md" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
}
export default CreatePosts