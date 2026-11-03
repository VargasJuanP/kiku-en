/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/**
 * @type { KikuPlugin }
 */
export const plugin = {
  ExternalLinks: (props) => {
    const { html, useGeneralContext } = props.ctx;
    const { ankiDroidAPI } = useGeneralContext();

    function NadeshikoLink() {
      const url = new URL("https://nadeshiko.co/search/sentence");
      url.searchParams.set("query", props.ctx.$ankiFields.Expression);
      const src = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAgICAgJCAkKCgkNDgwODRMREBARExwUFhQWFBwrGx8bGx8bKyYuJSMlLiZENS8vNUROQj5CTl9VVV93cXecnNEBCAgICAkICQoKCQ0ODA4NExEQEBETHBQWFBYUHCsbHxsbHxsrJi4lIyUuJkQ1Ly81RE5CPkJOX1VVX3dxd5yc0f/CABEIACAAIAMBIgACEQEDEQH/xAAwAAEAAgMBAAAAAAAAAAAAAAAHAwUBAgYEAQADAQEAAAAAAAAAAAAAAAAAAQIFBv/aAAwDAQACEAMQAAAA2mskXL7kq86px4cg0EUThdOK/Cv/xAAnEAACAQQBAgUFAAAAAAAAAAABAgMEBRESABQxBhAhQVETFSIyYv/aAAgBAQABPwDkFPPUyfTgiaR9S2q98L3PKikqqUxCeB4zIgdNhjKn38rFbxcLhHE8ReFfylAfQhedBbbMXrKWAplRG+XJUKT39eRpQXzpusjMjRxkqU2VHOBsTjt69lJ54mtVPbaxBA6COVcrFliyY9yTyphrWkp5qKvkpp4X2QhiFJ/vXBxwvaGsge410NZTLEVmqJipWTX9+eGXsc1ohktdKtPDIm7QKNGjJ+VHY8u3T/cak09U1REWykjEk4PsS3x5SwQzNE8sSu0edCwzrnvjPASpypIPyDg+X//EABwRAAIDAAMBAAAAAAAAAAAAAAEDAAIRBBJCof/aAAgBAgEBPwBSLMHbzsYg0BsDtfsTyCsYRojXltQDXMn/xAAiEQACAQQCAQUAAAAAAAAAAAABAgMABAUREjETITJBcYH/2gAIAQMBAT8AvspFaN4tcpSux1x/as8olw6wuhWUqT6e0/VZHEpeMJFfhJ8nsEVYYtbKWR1mZgw1rVf/2Q==`;
      return html`<a href=${url.toString()}>
        <img class="size-5 object-contain rounded-xs" src=${src} />
      </a>`;
    }

    function AnkiDroidBrowseButton() {
      const onclick = () => {
        void ankiDroidAPI?.ankiSearchCard(
          `("note:Kiku" OR "note:Lapis") AND "Expression:*${props.ctx.$ankiFields.Expression}*"`,
        );
      };
      return html`<button class="text-xs btn btn-xs" on:click=${onclick}>Browse</button>`;
    }

    return [
      // includes the default ExternalLinks
      props.DefaultExternalLinks(),
      NadeshikoLink(),
      AnkiDroidBrowseButton(),
      // you can create as many links as you want
    ];
  },
};
