# 00004 - Migrate to Deno again

## Abstract

I watched this video and thought it would be funny to convert back to Deno after
the Deno -> Zig -> Rust rewrites, like a game of telephone.

[![https://www.youtube.com/watch?v=JXWvWhfWrUU](https://img.youtube.com/vi/JXWvWhfWrUU/0.jpg)](https://www.youtube.com/watch?v=JXWvWhfWrUU)

## Context and Problem Statement

Originally the cli was migrated to zig due to the size of the binary and lack of
macros which allow you to embed text files at compile time.

## Considered Options

### Don't Migrate to Deno

Nah.

### Migrate to Deno

Deno just shipped `text` and `bytes` import attributes which allow you to embed
arbitrary files which can be used to simplify the template system.

We can distribute our app at first as an https es module until jsr supports the
new import attribute types.

## Decision Outcome

🤷🏻‍♀️
