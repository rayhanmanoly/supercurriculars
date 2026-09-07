import React, { useState, useEffect } from 'react';
import Select from 'react-select';

const MultiSelectWithReactSelect = ({ options, onChange, value}) => {


  const handleChange = (selected) => {
    onChange(selected);
  };

  return (
    <div>
      <Select
        isMulti
        name="options"
        options={options}
        value={value}
        className="basic-multi-select"
        classNamePrefix="select"
        {...(onChange) ? {onChange: handleChange} : {}}
        
      />
    </div>
  );
};

export default MultiSelectWithReactSelect;