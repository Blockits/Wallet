import React from 'react';
import PropTypes from 'prop-types';

function Greeting(props) {
  return (
    <div>
      <p>{props.message}!</p>
      <img src={props.icon} alt="extension icon" />
    </div>
  );
}
Greeting.propTypes = {
  message: PropTypes.object,
  icon: PropTypes.string,
};

export default Greeting;
