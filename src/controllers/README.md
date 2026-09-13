# Controllers

The layer between the Model and the View.

A controller is a hook. It reads from repositories, holds whatever state the
screen needs, derives what the screen displays, and returns handlers. It knows
about React; it does not know about layout, colour, or any component.

The contract, in both directions:

- **A View never imports a repository.** If a screen is calling `fetchDoses`
  directly, the controller is missing.
- **A controller never imports from `views/`.** Not even a type. If it needs a
  shape the View also needs, that shape belongs in `models/`.
- **A controller returns data and functions, never JSX.**

React is not MVC and pretending otherwise produces ceremony rather than
structure. What is actually being bought here is testability: every controller
can be exercised with a fake repository and no renderer, and every View can be
rendered with a literal object. That is the reason for the split, and it is the
test of whether a given piece of code is in the right file.
