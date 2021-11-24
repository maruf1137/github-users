import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUsers, setgithubUsers] = useState(mockUser);
  const [repos, setrepos] = useState(mockRepos);
  const [followers, setfollowers] = useState(mockFollowers);

  const [requests, setrequests] = useState(0);
  const [isLoading, setisLoading] = useState(false);
  const [error, seterror] = useState({ show: false, msg: "" });

  const githubSerachUser = async (user) => {
    toggleError();
    setisLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );

    if (response) {
      setgithubUsers(response.data);
      const { login, followers_url } = response.data;

      // // repos
      // await axios(`${rootUrl}/users/${login}/repos?per_page=100`).then((response) =>
      //   setrepos(response.data)
      // );
      // // followers
      // await axios(`${followers_url}?per_page=100`).then((response) =>
      //   setfollowers(response.data)
      // );

      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ]).then((results) => {
        const [repos, followers] = results;
        console.log(repos, followers);
        const status = "fulfilled";

        if (repos.status === status) {
          setrepos(repos.value.data);
        }
        if (followers.status === status) {
          setfollowers(followers.value.data);
        }
      });
    } else {
      toggleError(true, "there is no user with this username");
    }
    checkRequest();
    setisLoading(false);
  };

  const checkRequest = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;

        setrequests(remaining);
        if (remaining === 0) {
          // throw an error
          toggleError(true, "sorry, you have exeeded your hourly rate limit");
        }
      })
      .catch((err) => console.log(err));
  };

  function toggleError(show, msg) {
    seterror({ show, msg });
  }

  useEffect(checkRequest, []);

  return (
    <GithubContext.Provider
      value={{
        githubUsers,
        repos,
        followers,
        requests,
        error,
        githubSerachUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubContext, GithubProvider };
