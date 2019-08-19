import React, { useState, useEffect } from 'react';
import axios from "axios";
import './App.css';
import * as d3 from "d3";

const buffer = 10;

function App() {

  // declare state letiables
  const [query, setQuery] = useState("");
  const [pObj, setPObj] = useState({ pos: 40, neg:2 });

  useEffect(() => {
    plot();
  });


  function plot() {
    // set the dimensions and margins of the graph
    let width = 380
    let height = 380
    let margin = 50

    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    let radius = Math.min(width, height) / 2 - margin

    d3.select("svg").remove(); 

    // append the svg object to the div called 'my_dataviz'
    let svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // data retrieved from the server
    let data = pObj;
    
    // set the color scale
    let color = d3.scaleOrdinal()
    .domain(["pos", "neg"])
    .range(d3.schemeDark2);

    // Compute the position of each group on the pie:
    let pie = d3.pie()
    .sort(null) // Do not sort group by size
    .value(function(d) {return d.value; })
    let data_ready = pie(d3.entries(data))

    // The arc generator
    let arc = d3.arc()
    .innerRadius(radius * 0.5)         // This is the size of the donut hole
    .outerRadius(radius * 0.8)

    // Another arc that won't be drawn. Just for labels positioning
    let outerArc = d3.arc()
    .innerRadius(radius * 0.9)
    .outerRadius(radius * 0.9)

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    svg
    .selectAll('allSlices')
    .data(data_ready)
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', function(d){ return(color(d.data.key)) })
    .attr("stroke", "white")
    .style("stroke-width", "2px")
    .style("opacity", 0.7)

    // Add the polylines between chart and labels:
    svg
    .selectAll('allPolylines')
    .data(data_ready)
    .enter()
    .append('polyline')
    .attr("stroke", "black")
    .style("fill", "none")
    .attr("stroke-width", 1)
    .attr('points', function(d) {
    let posA = arc.centroid(d) // line insertion in the slice
    let posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
    let posC = outerArc.centroid(d); // Label position = almost the same as posB
    let midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
    posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
    return [posA, posB, posC]
    })

    // Add the polylines between chart and labels:
    svg
    .selectAll('allLabels')
    .data(data_ready)
    .enter()
    .append('text')
    .text( function(d) { return d.data.key } )
    .attr('transform', function(d) {
        let pos = outerArc.centroid(d);
        let midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
        pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
        return 'translate(' + pos + ')';
    })
    .style('text-anchor', function(d) {
        let midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
        return (midangle < Math.PI ? 'start' : 'end')
    })
  }

  function handleChange(e) {
    setQuery(e.target.value);
  }

  // ask the server for the analysis of the user's recent tweets
  function handleSubmit(e) {
    e.preventDefault();
    const queryString = `http://localhost:4000/api/${query}`;
    axios.get(queryString)
    .then(res => {
      setPObj({
        pos: res.data.positive + buffer,
        neg: res.data.negative + buffer
      });
      console.log(res.data);
    })
    .catch(err => console.log(err));
  }

  return (
    <div className="App">
      <header className="App-header">
        Tweet Analysis
      </header>
      <p className="App-description">
        Analysis of a user's recent tweets using nlp api 
      </p>
      <form onSubmit={handleSubmit} className="user-search">
        <input placeholder="Twitter username" type="text" name="username" onChange={handleChange} className="input-element username"/>
        <button className="btn search-btn">Submit</button>
      </form>
      <div id="my_dataviz">
            
      </div>
    </div>
  );
}

export default App;
