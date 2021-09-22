# United Arab Emirates

UAE has two areas of shared control. These are called out as Neutral Areas in Natural Earth. 

* One area is under shared control with neighboring country Oman. For individual country layers we have set a precedent where we show boundaries according to that country's worldview. So this shared control area is merged with the appropriate emirate in UAE.

* The second area appears to be under shared control of two emirates of UAE, Fujairah and Sharjah. We do not have a precedent for showing different worldviews within the same country. To maintain topologically distinct areas for visualization, the area of shared control is added to only one of the emirates (Sharjah) consistent with OpenStreetMap.

See also the [Wikipedia article](https://en.wikipedia.org/wiki/Emirates_of_the_United_Arab_Emirates)

Running `make` in this directory combines boundaries and attributes from the Administrative regions layer, Arabic names from `ae.csv`, and merges the Neutral Areas into their respective emirates.
