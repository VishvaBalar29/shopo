import React from "react";
import { useSelector } from "react-redux";
import EventCard from "../components/Events/EventCard";
import Header from "../components/Layout/Header";
import Loader from "../components/Layout/Loader";

const EventsPage = () => {
  const { allEvents, isLoading } = useSelector((state) => state.events);

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div>
          <Header activeHeading={4} />
          {
            allEvents.length != 0
              ?
              <><EventCard active={true} data={allEvents && allEvents[0]} /></>
              :
              <><h1 className="text-center w-full pb-[100px] text-[20px] mt-5 pt-5">
                No Events have!
              </h1></>
          }

        </div>
      )}
    </>
  );
};

export default EventsPage;
