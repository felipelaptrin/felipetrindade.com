---
title: RSS as a tool to stay up-to-date with tools, news, and posts
date: "2024-10-21T12:05:32.169Z"
description: Let's explore what RSS is and how you can use it to keep up-to-date with tools, news, and posts
---

We all know that the technology world evolves FAST. The amount of new tools created weekly, updates, bug fixes, new features, tech blog posts... It's impossible to manually keep track of all these things without an automatic way. That's where we are going to use RSS in our favor! Maybe the word "RSS" is not familiar to you but I bet you have already seen its icon.

![RSS icon](./rss.png)

## RSS
RSS (it can mean several things, such as Really Simple Syndication or Rich Site Summary) is one of the elders of the internet, created in 1999. We are talking about a time when internet speed was around [127 kilobits per second](https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2010/m06/annual-cisco-visual-networking-index-forecast-projects-global-ip-traffic-to-increase-more-than-fourfold-by-2014.html). Downloading a 3MB audio took three minutes back then! You can imagine how slow it was to surf the web back then...

Today our internet speed is way faster [(at least 1000x)](https://www.statista.com/chart/31075/global-average-internet-download-speed/) so doing "ordinary" things, such as navigating the internet, uploading attachments in emails, watching videos, and other activities are way faster than it was more than two decades ago.

With that being said, can you imagine the pain of opening a website only to check if a new post/news was published in the feed? The idea is that the website could publish posts/news in a different type of feed called RSS. This special feed could be interpreted by a feed reader that would allow the user to know when something new was published and the data transfer would also be significantly smaller. Today RSS is more used to save time, and as you know time is valuable. Notice that RSS is not magical, it relies on the website to implement the RSS feed so it can be consumed by the feed reader (also known as feed aggregator). Today, some fancy feed readers can automatically scrape a website and turn it into an "RSS feed" (but it might be a payed feature in our feed reader).

Something very common in tech blogs is to, instead of implementing an RSS feed, create a newsletter, where you get the new blog posts via e-mail. Ideally, though, both should be presented!

The RSS feed is just an XML formatted plain text, as you can see in my [website's RSS](https://felipetrindade.com/rss.xml). As you can see, this is pretty difficult for us to read but very easy for a machine to understand. So every time this XML changes with a new section, the feed reader knows that the website has a new post.

## Feed readers
There are several feed readers out there but in general, they can be divided into two categories: desktop and web apps. Desktop readers, such as [RSS Guard](https://github.com/martinrotter/rssguard) or [Fluent Reader](https://github.com/yang991178/fluent-reader) are "off-line" readers, which means you install them on your computer and needs your computer to access the feed reader. A more handy solution (because you simply need to access it using any web browser) is web feed readers such as [Feedly](https://feedly.com/) or [Inoreader](https://www.inoreader.com/). Choose the option that fits your needs the most. One important thing to mention about web feed readers is that they are usually paid (but offer an always free version with limited features).

This is not an ad or recommendation: I use Feedly and for now, it works fine for my use case. It does not support some features in the free plan but I tolerate. But you should really use any tool that fits your needs.

## RSS feeds suggestion
Currently, I divide my RSS feed into two categories:
- **Tech-blogs**: Mostly tech companies blogs presenting solutions, problems, and tools. Some of the tech blogs I follow are [AWS Architecture Blog](https://aws.amazon.com/blogs/architecture/), [Engineering at Meta](https://engineering.fb.com/), [LinkedIn Blog](https://www.linkedin.com/blog/engineering), [Slack Engineering](https://slack.engineering/), [Spotify Engineering](https://engineering.atspotify.com/). I also recommend personal tech blogs, such as [SamWho](https://samwho.dev/) and [mine](https://www.felipetrindade.com/) (of course!).
- **Tools releases**: This helps me stay tuned about releases of the main tools I use. Some of the tools I follow are [Opentofu](https://github.com/opentofu/opentofu/releases), [Terragrunt](https://github.com/gruntwork-io/terragrunt/releases), [CDK](https://github.com/aws/aws-cdk/releases).

Some important things to mention:
- Today is very common for tech people to publish things in blogs like [Medium](https://medium.com/) and [Dev.To](https://dev.to/). I still think RSS is relevant and does not substitute them, use both in your favor!
- The "tools release" DOES NOT replace [Dependabot](https://github.com/dependabot) at all. You should still use it in your projects to update the versions of your dependencies.
- It's common for tools to offer release notes (e.g. [Fastapi](https://fastapi.tiangolo.com/release-notes/)) and upgrading notes (e.g. [ArgoCD Upgrading guide](https://argo-cd.readthedocs.io/en/latest/operator-manual/upgrading/overview/)). You should still read them, and treat the RSS as just a "preview".
- Some GitHub repositories have INTENSE release cycles, with beta, dev, and test versions being deployed frequently, this will spam your RSS feed a bit.

## Cya!
This was a not-so-common blog post from my side. Less technical but still important to comment on. This might be extremely helpful if you struggle to stay up-to-date with tools and tech articles.

See you around! 👋
