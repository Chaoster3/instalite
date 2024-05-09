import { useState, useEffect } from "react";
import axios from "axios";
import { BACKEND_URL } from "./utils/constants";
import { useNavigate } from "react-router-dom";

const axiosInstance = axios.create({
  withCredentials: true
});

const CreatePosts = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    content: "",
    hashtag_names: [],
  });
  const [formStatus, setFormStatus] = useState("");
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [image, setImage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleImageInput = (e) => {
    setImage(e.target.file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = new FormData();
      body.append("image", image);
      body.append("content", form.content);
      body.append("hashtag_names", form.hashtag_names);
      const response = await axiosInstance.post(
        `${BACKEND_URL}/posts/createPost`,
        body
      );
      if (response.status === 201) {
        setFormStatus("Post created successfully");
        navigate('/');
      } else {
        setFormStatus("Post creation failed");
      }
    } catch (error) {
      setFormStatus("Post creation failed");
      console.error("Error creating post:", error);
    }
  };

  useEffect(() => {
    if (searchInput) { 
      searchTags();
    } else {
      setSearchResults([]);
    }
  }, [searchInput]);

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const searchTags = async () => {
    try {
      setErrorMessage('');
      console.log(searchInput);
      const response = await axios.get(`${BACKEND_URL}/tags/searchHashTags/${searchInput}`);
      if (response.status === 200) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error('Error searching tags:', error);
    }
  };

  const finalizeTag = async () => {
        setSearchInput('');
        setForm(prevForm => ({
          ...prevForm,
          hashtag_names: [...prevForm.hashtag_names, searchInput]
        }));
  };

  const addSearchedTagToFinal = (tag) => {
    if (!form.hashtag_names.includes(tag.name)) {
      setForm(prevForm => ({
        ...prevForm,
        hashtag_names: [...prevForm.hashtag_names, tag.name]
      }));
    }
  };

  const removeFinalTag = (tagName) => {
    setForm(prevForm => ({
      ...prevForm,
      hashtag_names: prevForm.hashtag_names.filter(tag => tag !== tagName)
    }));
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="w-full max-w-md p-8 bg-white rounded-md shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">What's on Your Mind?</h1>
        <div>
          <textarea
            type="text"
            name="content"
            rows="5"
            value={form.content}
            onChange={handleChange}
            placeholder=" Add content here"
            className="w-full mb-2 border border-gray-300 rounded-md"
          />
          <div className="flex flex-row place-content-evenly">
            Add image:
            <input
              type="file"
              placeholder=""
              value={image}
              onChange={handleImageInput}
              className=""
            />
          </div>
          <div className="flex items-center justify-between mb-4">
            <input
              type="text"
              placeholder="Search for tags"
              value={searchInput}
              onChange={handleSearchInputChange}
              className="w-2/3 px-4 py-2 mr-2 border border-gray-300 rounded-md"
            />
            <button type="button" onClick={finalizeTag} className="px-4 py-2 text-white bg-blue-500 rounded-md">Search</button>
          </div>
          <div className="flex flex-wrap mb-4">
            {searchResults.map((tag) => (
              <button key={tag.id} type="button" onClick={() => addSearchedTagToFinal(tag)} className="border px-3 py-1 mr-2 mb-2 text-sm bg-gray-200 rounded-md hover:border-red-500">{tag.name}</button>
            ))}
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Final Tags</h2>
            <div>
              {form.hashtag_names.map((tagName) => (
                <button key={tagName} type="button" onClick={() => removeFinalTag(tagName)} className="border px-3 py-1 mr-2 mb-2 text-sm bg-gray-200 rounded-md hover:border-red-500">{tagName}</button>
              ))}
            </div>
          </div>
          <p className={formStatus.includes('successful') ? 'text-green-500 mb-4' : 'text-red-500 mb-4'}>{formStatus}</p>
          <button type="submit" onClick={handleSubmit} className="w-full px-4 py-2 text-white bg-blue-500 rounded-md">Submit</button>
        </div>
      </div>
    </div>
  );
};

export default CreatePosts;