---
title: "Destruction of society"
date: 2026-08-30
---

> **society**
>
> [...]
>
> 3. (*countable*) The sum total of all voluntary interrelations between individuals.
>
> --- <https://en.wiktionary.org/wiki/society> (retrieved on 2026-08-30)

(I'm going to use the shorthand "I received" to mean "I was a participant in a conversation in which another participant has posted".
Also, this is a systemic issue, not a call-out post to anyone involved.
Therefore, quotations have been altered.
Some details have also been removed or altered.)

I received a review on some text I provided on assembly programming on a certain architecture.
The reviewer said that my text was missing information on addressing modes.
They included a ChatGPT response explaining various addressing modes, asking me to add descriptions of them in.
The ChatGPT response was almost entirely nonsensical.
The architecture does not *have* "addressing modes", in the sense where operands to an instructions can be provided in multiple ways.

I received a few comment replying to me in astonishingly information-sparse text.
I asked the author in private whether these were all written by themselves.
In response, they said yes.
Finding this highly unlikely, I asked further if one specific comment was written by themselves.
They explained that they wrote the rough points, and asked a large language model to flesh out the content.
They had apparently believed that this counts as having written it themselves.

I received a question with only a link to `https://gemini.google.com/share/[...]` and "What do you think about this network setup?", and no further information.
Linked was a "discussion" on structuring a local network to encompass a range of different devices, with some security isolation.
The participant asking the question did, in fact, expect everyone else to read the chat logs, instead of simply describing the requirements.

I received a question with only a link to `https://chatgpt.com/share/[...]` and "Folks, how do i fix this kind of errors?".
Linked was a "discussion" of firstly the error message, and then tens of pages of back-and-forth on how to diagnose it (incorrectly, five times), a multi-step procedure, and the creation of a utility script that would help automate this process.
When asked about the reason for asking the question in this way, the participant noted they were simply providing the full context.
Furthermore, the linked page was long but anyone can just "ask an AI to summarize it".
(The actual diagnosis process can be done with the single command line flag that was noted in the error message to print the full stack trace.
A future version of the software defaults to collecting and displaying more helpful, hopefully, information by default.)

I received a pull request to improve the a certain aspect of some code repository.
The 15 commits have messages written in [Conventional Commits], which was not used in the project.
It contains a framework designed to replace a commonly used utility, built *atop the utility itself*.
It also claims to simplify code by removing 10 separate scripts.
In reality, there were only three scripts, and they were simply merged into one.
It also claims backwards compatibility, but there was nothing to be backwards compatible with.

[Conventional Commits]: https://www.conventionalcommits.org/

I received a message claiming that people were "sick in the head" for opposing an `AGENTS.md` that essentially said contributors must follow `CONTRIBUTING.md`.
I replied saying that it was already mentioned in the `README.md` file.
Supposedly intelligent software that needs this sort of trivial guidance should be fixed upstream, instead of requiring more work on all use sites.
In response, I was accused of being "toxic" and "lacking in basic good faith".

I received a report from a user asking if a new version of a software has known regressions, and that they were getting "crazy results".
When asked for details, they only replied that that all connections to the local daemon were hanging.
No further inquries for possible details like logs or core dump stack traces were responded to.
Instead, the user spent the next 20 minutes ignoring requests for information and posted progress of "AI is debugging it too".
Multiple completely irrelevant observations are noted as important, with only the appearance of being helpful diagnoses.
There was "the smoking gun" (a SQLite WAL file, which is a result of normal operation), a "process handling bug" (intentional feature to preserve connections, like sshd), and a blame on another irrelevant software.
In reality, there was an opt-in experiment under actively development that was simply incompatible when mixing versions.

I received a patch email that supposedly fixes a bug in a C `for` loop where the index starts from 1 instead of 0.
However, 1 *was* correct.
The supposed bug would have been, for months, noticable by *everyone* using the software, since it was a boot failure.
When asked about what the bug is, they provided me with an extremely verbose reply, saying that they were reproduce it on their development tree with lots of other changes on top.
They said "You are right that the bug is not hardware-specific", and that they were "happy to provide the debugging infrastructure".
When specifically asked about the fact that this does not reproduce on upstream code, they said that they were going to rebase it on latest upstream and try it out.
They said if it doesn't reproduce on latest upstream, then "feel free to drop this".
