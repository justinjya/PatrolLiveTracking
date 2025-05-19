import { Map } from "@vis.gl/react-google-maps";
import React, { useContext } from "react";
import { LocationContext } from "../contexts/LocationContext";

function InteractiveMap() {
  const { currentLocation, zoom } = useContext(LocationContext);

  return (
    <Map
      style={{ width: "100vw", height: "100vh" }}
      defaultCenter={currentLocation}
      defaultZoom={zoom}
      gestureHandling={"greedy"}
      disableDefaultUI={true}
    />
  );
}

export default InteractiveMap;
