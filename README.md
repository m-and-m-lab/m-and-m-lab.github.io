# m-and-m-lab.github.io

Public site for the Mapping & Motion Lab: https://m-and-m-lab.github.io

The site is plain HTML with no build step. Edit a file, push to `main`, and GitHub Pages serves it within a minute or two.

- Research (one paper list with three views), simulation software, people, support, and the contact link are all in `index.html`. Each section has a comment saying how to add an entry.
- Headshots go in `assets/people/`, paper images in `assets/work/`. Keep them under about 300 KB.
- List only PhD students on the People page.
- Each paper is one `<li>` in `index.html`; its `data-` attributes decide which views it appears in. The comment above the list explains them.
- Label papers as "Preprint" (on arXiv) or "Workshop paper". Do not name venues a paper is submitted to.
- `scene-structure-il/` is the shared project site for HODOR and the scene graph paper.

# Adding a New Project Page to M&M Lab

This guide explains how to add a new page for your paper. 

---

## Prerequisite: Get the Template
This example uses the template from nerfies, you can you other templates too.
* **Original:** [nerfies/nerfies.github.io](https://github.com/nerfies/nerfies.github.io)

---

## Step 1: Create the Repository
1. Go to [m-and-m-lab](https://github.com/m-and-m-lab) on GitHub.
2. Click **New Repository**.
3. **Repository Name:** Use a clean, URL-friendly name (e.g., `junocam-calibration`).
4. **Visibility:** Public.

## Step 2: Upload the Website Files
Clone your new empty repository to your computer and copy the template files into it.

Your folder structure should look like this:

```
my-project-repo/
├── index.html        <-- The main website file (from template)
├── static/           <-- Folder containing CSS, JS, and Images (from template)
├── README.md         <-- Documentation for the code (standard GitHub readme)
└── src/              <-- (Optional) Your actual research code (Python, etc.)
```
Do not copy the .git folder from the template, only index.html and static/.

##  Step 3: Edit
Make required changes to the template.

##  Step 4: Publish (Enable GitHub Pages)

Once you have pushed your code and the index.html to GitHub:

1. Go to your repository's Settings tab.
2. Click Pages on the left sidebar.
3. Under Build and deployment:
   - Source: Deploy from a branch.
   - Branch: Select main (or master) and / (root).
4. Click Save.

Your site will be live at:

https://m-and-m-lab.github.io/YOUR-REPO-NAME
