<script>
  export let pages;
  export let currentPage;

  import { link } from "svelte-routing";
  import I18n from "i18n-js";
  import chevron_left from "../../icons/chevron-left.svg";
  import chevron_right from "../../icons/chevron-right.svg";

  let displayMenu = false;
</script>

<style>
  .side-menu {
    display: flex;
    flex-direction: column;
    background-color: var(--grey-2);
  }

  button.menu-link {
    display: none;
    margin-top: 10px;
  }

  @media (max-width: 820px) {
    .hide-menu-items {
      display: none;
    }

    button.menu-link {
      display: inline-block;
    }
  }

  a.menu-item {
    padding: 14px;
    color: var(--text-grey-dark);
    font-weight: 600;
    white-space: nowrap;

    display: flex;
    align-items: center;

    --padding-right: 16px;
    --border-width: 7px;
    padding-right: calc(var(--padding-right) + var(--border-width));
  }

  a.menu-item.active {
    background-color: white;
    border-right: var(--border-width) solid var(--purple);
    padding-right: var(--padding-right);
  }

  :global(.side-menu svg) {
    fill: var(--text-grey-dark);
  }

  :global(.side-menu svg.menu-link) {
    margin-right: 5px;
  }
</style>

<div class="side-menu">
  <button class="menu-link" on:click={() => (displayMenu = !displayMenu)}>
    {@html displayMenu ? chevron_left : chevron_right}
  </button>
  <div class:hide-menu-items={!displayMenu}>
    {#each pages as { path, icon }}
      <a
        href={path}
        use:link
        class="menu-item"
        class:active={path === currentPage.path}>
        {@html icon}
        <span>{I18n.t(`routes.${path}`)}</span>
      </a>
    {/each}
  </div>
</div>
