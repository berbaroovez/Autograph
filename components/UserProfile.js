import styled from "styled-components";
import { ethers } from "ethers";

export default function PlayerProfile({
  owner,
  id,
  signers,
  avatar,
  title,
  signedin,
  signProfile,
}) {
  return (
    <PlayerZone>
      <UserInfo>
        <Avatar src={avatar} alt="avatar" />
        <h2 title={title}>{owner}</h2>
      </UserInfo>
      {/* <PlayerID>{id}</PlayerID> */}
      <h3>Signers</h3>
      {signers.map((signer) => {
        return <div key={signer}>{signer}</div>;
      })}

      <SignProfileButton
        disabled={!signedin}
        onClick={() => {
          signProfile(title);
        }}
      >
        Sign
      </SignProfileButton>
    </PlayerZone>
  );
}

const PlayerZone = styled.div`
  position: relative;
  font-family: sans-serif;
  display: flex;
  flex-direction: column;

  width: 250px;

  min-height: 100px;
  background: #7a8cef;
  border-radius: 10px;
  h1,
  h2,
  h3 {
    margin: 0;
    word-wrap: break-word;
  }
  h3 {
    padding-top: 10px;
  }
  padding: 10px;
`;

const PlayerID = styled.p`
  position: absolute;
  top: -10px;
  right: 10px;

  color: white;
  font-size: 30px;
`;

const Avatar = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SignProfileButton = styled.button`
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 70px;
  height: 20px;
  background: #ff5858;
  cursor: pointer;
  &:disabled {
    cursor: not-allowed;
  }

  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 5px;
  border: none;
  font-weight: bold;

  &:active {
    box-shadow: 0px 0px 0px rgba(0, 0, 0, 0.25);
  }
`;
