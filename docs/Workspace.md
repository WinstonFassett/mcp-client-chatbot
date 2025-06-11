# Workspace Notes

This is where we track global instructions and describe what we are actively working and focused on.

I am an expert swe with 25 years experience.

I am running the dev server. You can run another if you want, ie to do api or ui smoke tests or something, but I always test on mine as you go. 

## Priorities

### Make. It. Work.

Make it work. Make it right. Make it fast. These are classic boundaries where a SWE should NEVER skip ahead.
And for our purposes, we ONLY care about making it work.
For TypeScript, that means focusing on breaking issues and ignoring inconsequential TS errors and warnings.

### Do NOT write new code files when PORTING. COPY using CLI (or script for 2+)

Do not waste time and tokens rewriting files. Instead create a script with the file operations to copy from the original source project. THEN make adaptations however you like. Script find/replace ie to replace ~/ matches within artifacts/bolt with ~/artifacts/bolt. 

### Do NOT get distracted by the details.

Focus on the big picture. Focus on the goal. Focus on the end result. Focus on the user's needs. Focus on the user's verification of success.

### Avoid going in circles

3x of the same failure demands a retro analysis of failures and a reassessment of the approach.

### Always explain in some detail, as a peer, what you are doing and why.

## Current Focus: Embed Bolt.new as an artifact

As an alternative to our WebContainerCodeArtifacts implementation.

Here's a dictated brain dump from earlier about how I arrived at this.

We are working on adding artifact features to this chat by where an artifact is a thing that opens in a new window and that we can track different versions on the user can navigate across those different versions. We have a bunch of these lately. We've been working on the code artifacts and they've done several treatments and they're not all working, but I would really like to tighten it all up . I'm the least worried about what I would call the simple code black artifact. I think that's what we did call it because it's it doesn't have a run time. The next simplest is the HTML fragment artifact which I don't think it renders right now. I think it has issues with however we are doing the rendering and so I think we may need to do some research on how it's been implemented by other engineers trying to do the stuff in their projects get hub you know when it comes to CSSHTML that's probably one thing and maybe we should have something like that like this just the SSHNHT Alan, so it's safe from scripting attacks maybe although I guess we'd need to sanitize it but we could that would be an interesting approach I don't know what to call it. No script HTML fragment, but what we really were trying to implement was a fragment that could handle scripts and so it's previewer just you know run it in an eye for it. Maybe you inject the contents into it. I'm not sure but also that's not my teacher. I'm just giving you context. I'm getting the important stuff which is coding runtime and virtual IDs. First thing that we did was drop something that was for sand pack and it took a lot of work. We got something in place and on the plus side the editing environment looks pretty nice and you can actually edit it. It would be nice if it was full height. It's just a layout of improvement we need to mak for the sand pack JS projects the biggest issue with those that we never got the preview actually working like it was a app and looking at the package Jason it wasn't appropriate for a react app and I know that sand pack has a concept of templates and I know they have a bunch of starter ones several I think we need to become aware of those our chat but be aware of with the different template options are it's looking pretty good the main issues that the preview needs to work after we did that I wanted to try web containers, and that was also some of required a lot of iteration, and we finally got something where in the kit in this case, the preview does work in the table to run although it's not doing react it's running an express server because what containers can do that where a sand p it's just a bundle I think anyway so that successfully runs an express server using no demand so that when I edit things they reload and the preview actually updates, which is wonderful issue with that one is that the experience is gross and terrible. You have to click and edit button to start edit. It's all this. The deeming contrast is on so there's white on white and you know it's not very good also, I think at this point we might be able to abstract out the IDE concept and separate from the run times so that we could have our nice pretty IDE implementation consistent across these things but different internal components for the runtime i.e. the preview and the console and I guess probably also the file system shouldn't speak, but yeah, I would like to look at what we did for sand pack, which is very nice. Fix the height to be full high and then figure out how to make the web container version consistent with that. Also need to start thinking about a sort of mapping of projects and platforms frameworks to the different run times where we should almost always prefer. There should be a sort of priority that we should go through, and I don't know if it makes sense to burden the LLM with all of this, but when I asked for just simple HTML without interactivity, we could you just a HCLCSS pregnant without JavaScript if they ask for interactivity for an HTML page with JavaScript and we could do that without needing the other run times, but if a bundler is needed for a spa type framework, then sand pack is a fit as long as there is no no JS or server dependency and we can let the sand pack bundle and then or anything that requires no JS, which is like an Astro or an XJS spelt kit server applications then those would go in container artifacts. Something else to consider is the layout here which I don't know and actually this brings me to another thing that we didn't really get into and which maybe it's a separate thread and maybe I should try it first. I don't know although we're further with this and that is bolt.new is wonderful. I love it. I've used it a lot. It's incredibly productive for me and it's open source and I thought we were using it for inspiration but it turned out that we never actually pulled the repository down. It seems although actually I think we just lost the sub module contents at some point because we do have a good write up of how old is built, but what I wanna know because I like this idea is if we can Justin bed bolt if I can just lift all of it I mean, copy their MIT license code give them credit whatever but basically lift almost the entire bolt app into our app, which I think ought to be pretty compatible bolt is client-side only for the most part so what I wanna do is I wanna know if we just lift all of it almost all of it and then adjust to Ware. OK we're gonna end up not using the overall bolt chrome and frame shell thing we're gonna use our chat bot so we're gonna need to figure out we would use our chat, UI and figure out how to incorporate rendering bolt messages into our chat UI and then figure out how to render the bolt IDE and previews into an artifact pain panel because I really like bolt a lot of people do and I wonder if anybody's tried to imported or embedded into an app I know that convex has create a thing called chef which is basically some product which is a fork of bolt and I know there's a community bolt which we could also in bed honestly the bolts.DIY might be a better thing to consider implementing or embedding because it's community or it's built to support a bunch of different models, but then again our chat is built to sports models and so I don't know I don't know yet. I think we should probably get sub modules of both and look at them and then determine how we could using this command line primarily straight copy most of it and get it working to some extent on its own separate route to just get all the kinks worked out and then pour the pieces we want into our app that sounds like a fun exploration that could be very rewarding yeah I think I should try that first.

We already have an analysis of bolt at inspiration/bolt.md

Use git to bring in the submodules just for bolt.diy and bolt.new in inspiration

diy is a community fork of bolt.new which has not had commits in about 6 mos. 

It's probably worth reading the change log of bolt.DIY to see what they've added see what we want to harvest from it. I would like to have a similar write up and inspiration of old.DIY and then in our docs, I would like you to create a document or bolt artifacts bolt yes bolt artifacts. I don't think we need to go into too much detail on features here because the goal is to lift as much as we can wholesale in terms of entire files and file trees I would like to Start by creating artifacts/bolt and copying in I don't know possibly the entire project from either bolt DIY or bolt new whichever seems to be the best foundation, and then looking at its package Jason to figure out what dependencies we need and add those/reconciled them with our own package, Jason then try to create a route where we in bed bolt hole as is I think that once we have proven that integration and old actually vendors in our route or somewhere once we have that, I think we're in great shape we can start actually factoring it into our a but we're not there yet. That's what I want you to do now and I want you to be very prudent about how you do it if you have a bunch of file system actions in mind it might be best to write those as scripts when it's more than a couple of commands so that we don't have too many round trips with the AI and yeah, actually I would like for you to think through your plan and what files you're gonna copy and really you don't need to be specific about the files. Well, I'm hoping we can just be like copy the source delete any problematic stuff which if we haven't installed Dan modules I don't think we need to worry about that, you know maybe copying I don't know about you decide whether we copy the source folder copy the whole project folder but that's what I'm getting out. Big file system moves, followed by adaptations to get the whole app running here on a ripped.

# Bolt UX Fidelity on /bolt route

We are getting a standalone bolt workbench going on /bolt

It clones a git repo and loads and renders workbench, has some style issues with them, does not preview yet.

styles are a bit off but close. code editor seems to think its in a light theme when i'm in a dark one. workbench nav buttons are white. filetree text is black on white but i don't see the toggles, probably bc black on black. 

we copied in all the bolt components and are using those instead of our own ui/components. so they should have the right markup. probably missing styles. here's class of one that i suspect should have a solid bg but has no bg

class="max-h-[50vh] min-w-[300px] overflow-scroll bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor shadow-sm rounded-lg"

I have determined the problem is that while both codebases use data-theme on :root, 
there is a conflict because ours uses named themes like cyberpunk-neon-dark and theirs uses dark/light. So we need to update the imported styles from Bolt to use better selectors than explicit "dark" and "light" because our app does not have those.

Chat. How should we address this? 